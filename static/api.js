/// <reference path="socket.io.min.js"/>
class HC {
  static socket;
  static userright = -1;
  static username;
  static lsid = "we7f1bd7hkcjgjhh97oq6xib4t54";
  static init() {
    this.socket = io();
    this.socket.on("statusb", function (e) {
      // console.log(e);
      HC.userright = e.right;
      HC.username = e.name || undefined;
    });
    this.socket.on("onmsg", function (data) {
      HC.msg.addMsgRecord( data,HC.msg.roomId);
      var obj = document.documentElement;
      var event = new CustomEvent("onmsg", data);
      obj.dispatchEvent(event);
    });

    return new Promise((resolve, reject) => {
      //get socket
      this.socket.on("connection", function (socket) {
        console.log("socket connected");
        //if rid_token available, use it
        var rid_token = JSON.parse(localStorage.getItem(HC.lsid));
        // 1000ms(max latency) for socket
        if (rid_token && rid_token.time > Date.now() + 1000) {
          console.log("rid login");
          HC.socket.emit("loginvials", rid_token.rid);
          HC.socket.on("statusb", resolve);
        } else resolve();
      });
    });
  }
  static user = {
    /**
     * @type {boolean}
     * @description get login or not
     */
    get IsloggedIn() {
      if (HC.userright != -1) return true;
      return false;
    },
    /**
     * @description get account access level
     * @type {string}
     */
    get Access() {
      return [undefined, "guest", "user", "admin"][HC.userright + 1];
    },
    /**
     * @description get account name
     * @type {string}
     */
    get accountName() {
      return HC.username;
    },
    /**
     * @example auth.Login("account","password").then((token)=>{user=new user(token)})
     * @async
     * @param {string} account - account name
     * @param {string} password - password
     * @param {JSON} [data={}] - reserved
     * @description login (express-session)
     * @return {Promise<string>} auth data from server (might be expired in last 60 minutes)
     */
    login: function (account, password, data = {}) {
      return new Promise(function (resolve, reject) {
        HC.socket.emit("login", account, password);
        HC.socket.on("statusb", function (e) {
          if (e.userright != -1) resolve();
          else reject();
        });
      });
    },
    /**
     * @async
     * @description logout(express-session)
     * @return {Promise<boolean>} ture if success
     */
    logout: function () {
      return new Promise(function (resolve, reject) {
        HC.socket.emit("logout");
        this.socket.on("statusb", function (e) {
          if (e.userright == -1) resolve();
          else reject();
        });
      });
    },
    /**
     * @description store connection status in ls
     */
    storeConnection: function () {
      return new Promise(function (resolve, reject) {
        if (HC.user.IsloggedIn) HC.socket.emit("storeConnection");
        HC.socket.on("getrid", function (e) {
          localStorage.setItem(HC.lsid, JSON.stringify(e));
        });
        HC.socket.on("statusb", resolve);
      });
    },
  };
  static auth = {
    /**
     * @deprecated
     * @returns
     */
    login: function () {
      return HC.user.login(...arguments);
    },
    /**
     * @deprecated
     * @returns
     */
    logout: function () {
      return HC.user.logout(...arguments);
    },
  };
  static msg = {
    room: undefined,
    msgRecord: {},
    /**
     * @description send messenge to backend
     * @param {*} msg
     * @param {string} - room id
     * @async
     * @returns {Promise<boolean>} always return false
     */
    submit: function (msg, room = "room1") {
      HC.socket.emit("sendMessage", msg, room);
    },
    /**
     *
     * @param {string} room id
     */
    listenroom: function (room) {
      if (!this.msgRecord[room]) this.msgRecord[room] = [];
      this.room = room;
      HC.socket.emit("listenroom", room);
    },
    /**
     * @description roomId
     */
    get roomId() {
      if (!this.room) console.warn("room not selected!");
      return this.room;
    },
    get msgArray() {
      if (!this.room) console.warn("room not selected!");
      return this.msgRecord[this.room];
    },
    addMsgRecord: function (msg,room=this.roomId) {
      this.msgRecord[room].push(msg);
      this.msgRecord[room] = this.msgRecord[room].sort(
        (x, y) => +x.msgId - +y.msgId
      );
    },
    /**
     *
     * @param {number} amo - amount of msg to extend
     * @returns
     */
    extendmsg: function (amo) {
      return new Promise((resolvet, rejectt) => {
        if (amo > 20) throw new Error("too large number");
        if (!this.roomId) throw new Error("listenroom first");
        //find min number in manual cashe
        var min = 999999999;
        var temp1 = this.msgRecord[this.roomId];
        for (var i = 0; i < temp1.length; i++)
          min = Math.min(temp1[i].msgId, min);
        if (min == 999999999) min = -1;
        console.log((min));
        HC.socket.emit("extendmsg", min, amo);
        new Promise(function (resolve, reject) {
          HC.socket.on("extendmsgb", resolve);
        }).then(function (x) {
          console.log(x)
          x.forEach((x) => {
            HC.msg.addMsgRecord(x);
          });
          resolvet(x);
        });
      });
    },
  };
}
