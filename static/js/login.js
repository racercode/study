/// <reference path="api.js"/>
const destination = "/msg.html";
document.addEventListener("DOMContentLoaded", () => {
  HC.init().then(() => {
    console.log(HC.user.IsloggedIn);
    if (HC.user.IsloggedIn) window.location.href = destination;
  });
});
function login() {
  const account = document.querySelector("input#AccountName").value;
  const password = document.querySelector("input#Password").value;
  HC.user.login(account, password).then((e) => {
    if (HC.user.Access || -1 > -1) {
      HC.user.storeConnection().then(() => {
        alert("login");
        window.location.href=destination;
      });
    } else alert("wrong password or account name");
  });
  return false;
}
