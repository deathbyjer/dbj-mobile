if (!window.Mobile) Mobile = {};

Mobile.CurrentView = false;

// This is a timer function.
//   It will check the check function and execute the run function if it passes. Otherwise, it'll check the check function
//   again. 
Mobile.CheckAndRun = new Class({
  check: false,
  run: false,
  interval: 50,
  initialize: function() {
    var options = typeof(arguments[1]) == 'object' ? arguments[1] : {};
    if (options.check) this.setCheck(options.check);
    if (options.run) this.setRun(options.run);
    if (options.interval) this.interval = options.interval;
  },

  setCheck: function(check) {
    if (typeof(check) == 'function') this.check = check;
  },

  setRun: function(run) {
    if (typeof(run) == 'function') this.run = run;
  },

  start: function() {
    if (this.check && this.run)
      this.recurring = this.doCheckAndRun.periodical(this.interval, this);
  },

  doCheckandRun: function() {
    if (!this.check()) return;
    clearTimeout(this.recurring);
    this.run();
  }
});

Mobile.Loaders = {};
