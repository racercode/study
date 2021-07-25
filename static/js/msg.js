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
  const w=document.body.clientWidth;
    if(w>800){
        document.getElementById('dis-big').style.display="block";
        document.getElementById('dis-small').style.display="none";
    } else {
        document.getElementById('dis-big').style.display="none";
        document.getElementById('dis-small').style.display="block";
        document.getElementById('navbar').style.display="none";
    }
    document.getElementById('close2').style.display="none";
});

function _submit() {
  const msg = document.querySelector("input#Msg").value;
  document.querySelector("input#Msg").value="";
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
    document.getElementById('close').style.display="none";
    document.getElementById('close2').style.display="block";
  });
  return false;
}

function addToPanel(name, msg, time, end = false) {
  let node = document.createElement("span");
  node.innerHTML = `<p class="m-2 bg-white p-2 rounded-xl">帳號：${name}<br>訊息：${"".repeat(11 - name.length)}${msg}</p>`;
  if (end) document.querySelector("div#content").append(node);
  else document.querySelector("div#content").prepend(node);
}

function extendMsg() {
  HC.msg
    .extendmsg(5)
    .then((x) => x.reverse().forEach((x) => addToPanel(x.user, x.msg, x.time)));
}

var sideT = {
  open: function (ele=document.querySelector(".side")) {
    ele.classList.remove("fnone");
    ele.setAttribute("data-side-open", "true");
  },
  close: function (ele=document.querySelector(".side")) {
    ele.classList.add("fnone");
    ele.setAttribute("data-side-open", "false");
  },
  mode: function (ele=document.querySelector(".side")) {
    return ele.getAttribute("data-side-open") == "true";
  },
  switch: function (ele=document.querySelector(".side")) {
    if (this.mode(ele)) this.close(ele);
    else this.open(ele);
  },
};
var dis=false;
function turnon(){
    if(dis==false) document.getElementById('navbar').style.display="block",dis=true;
    else document.getElementById('navbar').style.display="none",dis=false;
}
function logout(){
  HC.user.logout().then(()=>{
    alert('登出成功');
    window.location.href="index.html";
  })
}
