/// <reference path="api.js"/>
const destination = "/msg.html";
var dis=false;
function turnon(){
    if(dis==false) document.getElementById('navbar').style.display="block",dis=true;
    else document.getElementById('navbar').style.display="none",dis=false;
}
document.addEventListener("DOMContentLoaded", () => {
  HC.init().then(() => {
    console.log(HC.user.IsloggedIn);
    if (HC.user.IsloggedIn) window.location.href = destination;
    const w=document.body.clientWidth;
    if(w>800){
        document.getElementById('dis-big').style.display="block";
        document.getElementById('dis-small').style.display="none";
    } else {
        document.getElementById('dis-big').style.display="none";
        document.getElementById('dis-small').style.display="block";
        document.getElementById('navbar').style.display="none";
    }
  });
  
});
function login() {
  const account = document.querySelector("input#AccountName").value;
  const password = document.querySelector("input#Password").value;
  HC.user.login(account, password).then((e) => {
    if (HC.user.Access || -1 > -1) {
      HC.user.storeConnection().then(() => {
        alert("登入成功");
        window.location.href=destination;
      });
    } else alert("wrong password or account name");
  });
  return false;
}
