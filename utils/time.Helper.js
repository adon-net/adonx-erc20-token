const toDateTime = (timestamp) => {
  var a = new Date(timestamp * 1000);
  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var year = a.getUTCFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
  return time;
}

const toTimeStamp = (year, month, day, hour, minute, second) => {
  var datum = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  return datum.getTime() / 1000;
}

const currentTimeStamp = () => { return Math.floor((new Date).getTime() / 1000); }

module.exports = { toDateTime, toTimeStamp, currentTimeStamp }