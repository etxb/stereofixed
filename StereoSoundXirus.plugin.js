/**
 * @name SturdyStereo
 * @version 0.0.1
 * @author xirus
 */

class SturdyStereo {
  _patcher = null;

  constructor() {
    this._patcher = null;
  }

  start() {
    this._patcher = new Patcher(this);
    this._patcher.applyPatch();
  }

  stop() {
    if (this._patcher) {
      this._patcher.revertPatch();
      this._patcher = null;
    }
  }
}

class Patcher {
  constructor(sturdyStereo) {
    this.sturdyStereo = sturdyStereo;
    this.webpack = BdApi.Webpack;
    this.patcher = BdApi.Patcher;
    this.voiceModule = this.webpack.getModule(this.webpack.Filters.byPrototypeFields("updateVideoQuality"));
  }

  applyPatch() {
    this.patcher.after("SturdyStereo", this.voiceModule.prototype, "updateVideoQuality", (thisObj, _args, ret) => {
      if (thisObj) {
        thisObj.voiceBitrate = 384000;
        thisObj.minimumJitterBufferLevel = 384000;

        const setTransportOptions = thisObj.conn.setTransportOptions;
        thisObj.conn.setTransportOptions = obj => {
          if (obj.audioEncoder) {
            obj.audioEncoder.params = { stereo: "1" };
            obj.audioEncoder.channels = 2;
            obj.audioEncoder.freq = 48000;
            obj.audioEncoder.rate = 384000;
            obj.audioEncoder.pacsize = 960;
          }

          obj.ducking = obj.idleJitterBufferFlush = obj.echoCancellation = obj.noiseSuppression = obj.automaticGainControl = obj.noiseCancellation = false;

          setTransportOptions.call(thisObj, obj);
        };

        return ret;
      }
    });
  }

  revertPatch() {
    this.patcher.unpatch("SturdyStereo", this.voiceModule.prototype, "updateVideoQuality");
  }
}