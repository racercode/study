/*var dis=false;
function turnon(){
    if(dis==false) document.getElementById('navbar').style.display="block",dis=true;
    else document.getElementById('navbar').style.display="none",dis=false;
}*/
document.write('<script src="js/api.js"></script>');
document.addEventListener("DOMContentLoaded", () => {
    const w=document.body.clientWidth;
    if(w>650){
        document.getElementById('dis-big').style.display="block";
        document.getElementById('dis-small').style.display="none";
    } else {
        document.getElementById('dis-big').style.display="none";
        document.getElementById('dis-small').style.display="block";
        document.getElementById('navbar').style.display="none";
    }
    if(HC.user.IsloggedIn==true) {
        document.getElementById('dis1').style.display="none";
        document.getElementById('dis2').style.display="block";
    } else {
        document.getElementById('dis1').style.display="block";
        document.getElementById('dis2').style.display="none";
    }
});
