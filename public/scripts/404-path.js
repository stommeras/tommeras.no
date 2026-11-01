// The page is built once as /404, so the path the visitor asked for is filled in here
let path = location.pathname;
try {
  path = decodeURIComponent(path);
} catch {}
document.querySelector('main .cmd').textContent = 'cd ' + path;
document.querySelector('.missing').textContent = path;
