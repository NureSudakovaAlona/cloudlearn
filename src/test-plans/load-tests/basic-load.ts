import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
  vus: 10,  // 10 віртуальних користувачів
  duration: '30s',
};

export default function () {
  const res = http.get('https://cloudlearn-ten.vercel.app/');
  
  check(res, {
    'статус 200': (r: http.Response) => r.status === 200,
    'час відповіді менше 500мс': (r: http.Response) => r.timings.duration < 500
  });
  
  sleep(1);
}