alert("wow");

enableBreaksBox = document.getElementById("break-switch");
breakInput = document.getElementById("break-time");
saveBtn = document.getElementById("save");

saveBtn.onclick = () => {
  breaksEnabled = enableBreaksBox.checked;
  breakTime = breakInput.innerHTML;
  alert(`breaks enabled: ${breaksEnabled} time: ${breakTime}`);
};
