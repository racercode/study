var express = require("express");
var MongoClient = require("mongodb").MongoClient;
var sconfig = require("./sconfig.json");
var readline = require("readline");
var fs = require("fs");
const winston = require("winston");
const PORT = 8080;

const roomlist=["room1"];
var app = express();
app.get("/:page", function (req, res) {
  const path = __dirname + "/static/pages/" + req.params.page;
  if (fs.existsSync(path)) res.sendFile(path);
});
app.use(express.static("static"));
app.get("/", function (req, res) {
res.send('This is a plain text response. If you see this, try use a right uri')
});
var server = require("http").createServer(app);
var io = require("socket.io")(server);
app.start = app.listen = function () {
  return server.listen.apply(server, arguments);
};

class hashtable {
  /**
   * @param {number} - amount of hashedbuckets
   */
  constructor(length) {
    this.bucketsLength = length || 50;
    this.container = {};
  }
  /**
   * @description push obj into hashtable
   * @param {any} ele
   * @param {any} pair
   */
  push(ele, pair) {

    var temp = ele;
    if (typeof ele == "number") temp = ele.toString();
    if (ele instanceof Object) temp = JSON.stringify(ele);
    var hash =
      Array.from(temp)
        .map((x) => x.charCodeAt(0))
        .reduce((a, b) => a + b) % this.bucketsLength;
    var temp2=[ele, pair]
    if (this.container[hash]) this.container[hash].push(temp2);
    else this.container[hash] = [temp2];
  }
  /**
   * @description find ele
   * @param {any} ele
   * @returns
   */
  find(ele) {
    var temp = ele;
    if (typeof ele == "number") temp = ele.toString();
    if (ele instanceof Object) temp = JSON.stringify(ele);
    var hash =
      Array.from(temp)
        .map((x) => x.charCodeAt(0))
        .reduce((a, b) => a + b) % this.bucketsLength;
    if (!this.container[hash]) return undefined;
    else
      return (this.container[hash].find((x) => x[0] == ele) || [
        undefined,
        undefined,
      ])[1];
  }
  /**
   * @description delete ele
   * @param {any} ele
   * @returns
   */
  delete(ele) {
    var temp = ele;
    if (typeof ele == "number") temp = ele.toString();
    if (ele instanceof Object) temp = JSON.stringify(ele);
    var hash =
      Array.from(temp)
        .map((x) => x.charCodeAt(0))
        .reduce((a, b) => a + b) % this.bucketsLength;
    if (!this.container[hash]) return undefined;
    else
      return this.container[hash].splice(
        this.container[hash].findIndex((x) => x == ele)
      );
  }
}

/**
 * @function log_
 * @description log into log.txt
 * @param {string} content
 * @param {bool} muted
 */
function log_(content, muted = true) {
  if (!muted) console.log(content);
  return new Promise(function () {
    var time = new Date();
    function tr_t(nu) {
      if (nu < 10) nu = "0" + nu;
      return "" + nu;
    }
    var stream = fs.createWriteStream("info.log", { flags: "a" });
    stream.write(
      `[${tr_t(time.getHours())}:${tr_t(time.getMinutes())}:${tr_t(
        time.getSeconds()
      )}]:${content}` + "\n"
    );
    stream.end();
  });
}

var socketRecord = new hashtable(100); //record of socket id and its own property

var roomRecord = new hashtable(100); //record of socket and its room attributes
var roomSendList = {};

io.on("connection", (socket) => {
  io.to(socket.id).emit("connection");
  socket.on("login", (name, password) => {
    if (!name && !password) return 0;
    sql.auth.find(name).then(function (user) {
      if (!!user && user.encoded_password == sql.auth.encode(password)) {
        //registered user (included guest)
        socketRecord.push([] + socket.id, user);
        io.to(socket.id).emit("statusb", {
          right: user.right,
          name: user.name,
        });
      }
      //not registered
      else io.to(socket.id).emit("statusb", { right: -1 });
    });
  });

  socket.on("sendMessage", (message, room) => {
    var user = socketRecord.find(socket.id) || { right: -1 };
    if (user.right >= 1) sql.msg.send(user.name, message, room);
  });

  socket.on("status", (data) => {
    var user = socketRecord.find(socket.id);
    if (user)
      io.to(socket.id).emit("statusb", { right: user.right, name: user.name });
    else io.to(socket.id).emit("statusb", { right: -1 });
  });

  socket.on("loginvials", (rid) => {
    var cur_data = socketRecord.find(rid);
    if (cur_data && cur_data.timestamp > Date.now()) {
      socketRecord.push([] + socket.id, socketRecord.find(rid));
      io.to(socket.id).emit("statusb", {
        right: cur_data.right,
        name: cur_data.name,
      });
    } else io.to(socket.id).emit("statusb", { right: -1 });
  });

  socket.on("storeConnection", () => {
    function randomstring(length) {
      var result = [];
      var characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      var charactersLength = characters.length;
      for (var i = 0; i < length; i++) {
        result.push(
          characters.charAt(Math.floor(Math.random() * charactersLength))
        );
      }
      return result.join("");
    }
    var rid = randomstring(100);
    var time = Date.now() + 60 * 1000;
    io.to(socket.id).emit("getrid", { rid: rid, time: time });
    socketRecord.push(rid, {
      ...{ timestamp: time },
      ...socketRecord.find([] + socket.id)
    });
    socketRecord.delete(socket.id);
    io.to(socket.id).emit("statusb", { right: -1 });
  });

  socket.on("logout", () => {
    var user = socketRecord.find([] + socket.id);
    //clear socketRecord
    if (user) socketRecord.delete([] + socket.id);
    //clear roomRecord and roomSendList
    var temp = roomRecord.find([] + socket.id);
    if (temp) {
      roomRecord.delete([] + socket.id);
      roomSendList[temp.room].splice(
        roomSendList[temp.room].findIndex((x) => x == socket.id),
        1
      );
    }
    //infer the client
    io.to(socket.id).emit("statusb", { right: -1 });
  });

  socket.on("listenroom", (room) => {
    if(!roomlist.includes(room))return 0;
    var user = socketRecord.find([] + socket.id);
    if (user && user.right >= 0) {
      //find room info
      var roomInfo = roomRecord.find([] + socket.id) || { room: "room1" };
      //delete old one of both
      var temp = (roomSendList[roomInfo.room] || []).findIndex(
        (x) => x == socket.id
      );
      if (temp != -1) roomSendList[roomInfo.room].splice(temp, 1);
      roomRecord.delete([] + socket.id);
      //if roomSendList hasn't inited, init it
      if (!roomSendList[room]) roomSendList[room] = [];
      //add record to both
      roomSendList[room].push(socket.id);
      roomRecord.push([] + socket.id, {
        room: room,
      });
    }
    io.to(socket.id).emit("roomrecive", { id: room });
  });

  socket.on("extendmsg", (top, amo) => {
    // top isn't inculded
    var roomInfo = roomRecord.find([] + socket.id) || { room: "room1" };
    var next_id = sql.msg.getvar(roomInfo.room).next_id;
    // if (top == -1) top = next_id;
    // if (amo > 20) return 0;
    // if (next_id < top) top = next_id;
    // if (top + 1 > amo) amo = top + 1;
    if (top == -1) top = next_id;
    if (next_id < top) top = next_id;
    if (top - amo < 0) amo = top;
    sql.msg.range(roomInfo.room, top, top - amo).then(function (re) {
      io.to(socket.id).emit("extendmsgb", re);
    });
  });

  socket.on("disconnect", () => {});
});

var client;
class sql {
  static client;
  static init() {
    const uri = sconfig.init.mongodb.uri || process.env.dbpath;
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    var promise_queue = [];
    return new Promise(function (resolve, reject) {
      client.connect((err) => {
        sconfig.unstable.roomlist.forEach((x) =>
          promise_queue.push(sql.msg.load(x))
        );
        Promise.all(promise_queue).then(resolve);
      });
    });
  }
  //for auth verification(user add included)
  static auth = {
    addUser: function (name, password, right = 1) {
      // right:0 guest, 1 user, 2 admin
      var user_content = {
        name: name,
        encoded_password: this.encode(password),
        right: right,
      };
      return new Promise(function (resolve, reject) {
        const collection = client.db("chat2").collection("auth");
        collection.insertOne(user_content, function (err, result) {
          var ok = result.result.ok;
          if (ok == 1) resolve();
          else reject();
        });
      });
    },
    encode: function (x) {
      return x;
    },
    find: function (name) {
      //inhert form session
      return new Promise(function (resolve, reject) {
        const collection = client.db("chat2").collection("auth");
        collection.find({ name: name }).toArray(function (err, back) {
          resolve(back[0]);
        });
      });
    },
  };
  //for msg management system(room var included)
  static msg = {
    tmp: {},
    // -
    // - msg
    //   - room1
    //   - room2
    //     - var_
    //       - next_id:0
    //get var for outer
    getvar: function (room) {
      return this.tmp.msg[room].var_;
    },
    //send msg
    send: function (name, content, room) {
      var msg_content = {
        msgId: this.tmp.msg[room].var_.next_id,
        time: Date.now(),
        user: name,
        msg: content,
        type: "msg",
      };
      this.tmp.msg[room].var_.next_id++;
      // socket here
      (roomSendList[room] || []).forEach(function (x) {
        io.to(x).emit("onmsg", msg_content);
      });
      return new Promise(function (resolve, reject) {
        const collection = client.db("chat2").collection(room);
        collection.insertOne(msg_content, function (err, result) {
          var ok = result.result.ok;
          if (ok == 1) resolve();
          else reject();
        });
      });
    },
    //search for msg
    //a=top (excluded) b=buttom(included)
    range: function (room, a, b) {
      return new Promise(function (resolve, reject) {
        const collection = client.db("chat2").collection(room);
        var result = [];
        for (let i = a - 1; i >= b; i--) {
          collection.find({ msgId: i }).toArray(function (err, back) {
            result.push(back[0]);
            if (result.length == a - b) resolve(result);
          });
        }
      });
    },
    //save room var
    save: function (room) {
      return new Promise(function (resolve, reject) {
        var coll = client.db("chat2").collection(room);
        coll.deleteOne({ type: "var" }, function (err, obj) {
          if (err) throw err;
        });
        coll.insertOne(
          {
            ...{ type: "var" },
            ...sql.msg.tmp.msg[room].var_,
          },
          function (err, result) {
            var ok = result.ok;
            if (ok == 1) resolve();
            else reject();
          }
        );
      });
    },
    //load room var
    load: function (room) {
      return new Promise(function (resolve, reject) {
        client
          .db("chat2")
          .collection(room)
          .find({ type: "var" })
          .toArray(function (err, back) {
            back[0].value;
            if (!sql.msg.tmp.msg) {
              sql.msg.tmp.msg = {};
              sql.msg.tmp.msg[room] = { var_: {} };
            }
            sql.msg.tmp.msg[room].var_ = back[0];
            resolve();
          });
      });
    },
  };
}

sql.init().then(function () {
  app.start(PORT);
  logger.info("server inited!");
});
const terminal = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
terminal.on("line", (line) => {
  switch (line.trim()) {
    case "save":
      var promise_queue = [];
      sconfig.unstable.roomlist.forEach((x) =>
        promise_queue.push(sql.msg.save(x))
      );
      Promise.all(promise_queue).then(() =>
        console.log("server variable saved!")
      );
      break;
    default:
      logger.error("instruction not found!");
  }
});
// sql.init().then(() => sql.msg.send("name","test val","room1"));

const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  // defaultMeta: { service: 'user-service' },
  transports: [
    new winston.transports.File({ filename: "node.error.log", level: "error" }),
    new winston.transports.File({ filename: "node.info.error.log" }),
  ],
});
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}
