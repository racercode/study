/// <reference path="api.js"/>
document.addEventListener("DOMContentLoaded", () => {
  HC.init().then(() => {
    if (!HC.user.IsloggedIn) window.location.href = "/login.html";
    document.documentElement.addEventListener("onmsg", () => {
      var tmp = [...HC.msg.msgArray];
      var x = tmp.pop();
      addToPanel(x.user, x.msg, x.time, true);
    });
  });
});

function _submit() {
  const msg = document.querySelector("input#Msg").value;
  HC.msg.submit(msg);
  return false;
}

function ChangeRoom() {
  const roomId = document.querySelector("input#room").value;
  HC.msg.listenroom(roomId).then(() => {
    document
      .querySelectorAll(".cm")
      .forEach((x) => x.classList.remove("fnone"));
    document.querySelectorAll(".cr").forEach((x) => x.classList.add("fnone"));
  });
  return false;
}

function addToPanel(name, msg, time, end = false) {
  let node = document.createElement("span");
  node.innerHTML = `<p>${name}${" ".repeat(11 - name.length)}: ${msg}</p>`;
  if (end) document.querySelector("div#content").append(node);
  else document.querySelector("div#content").prepend(node);
}

function extendMsg() {
  HC.msg
    .extendmsg(5)
    .then((x) => x.reverse().forEach((x) => addToPanel(x.user, x.msg, x.time)));
}
