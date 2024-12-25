document.getElementById('changeVideoBtn').addEventListener('click', function () {
  const videoURL = document.getElementById('videoURL').value.trim();
  const videoPlayer = document.getElementById('videoPlayer');

  if (videoURL) {
    videoPlayer.src = videoURL;
    videoPlayer.play();
  } else {
    alert('請輸入有效的影片連結！');
  }
});
