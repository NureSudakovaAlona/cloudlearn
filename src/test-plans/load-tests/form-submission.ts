import http from 'k6/http'; 
import { sleep, check } from 'k6';  

export const options = {   
  stages: [     
    { duration: '10s', target: 5 },   // наростання до 5 користувачів     
    { duration: '20s', target: 5 },   // утримання 5 користувачів     
    { duration: '10s', target: 10 },  // наростання до 10 користувачів     
    { duration: '30s', target: 10 },  // утримання 10 користувачів     
    { duration: '10s', target: 0 },   // зниження до 0   
  ], 
};  

export default function () {   
  const payload = JSON.stringify({     
    name: 'Test User',     
    email: `user-${__VU}-${__ITER}@example.com`,     
    phone: '+38050' + Math.floor(1000000 + Math.random() * 9000000)   
  });    

  const params = {     
    headers: {       
      'Content-Type': 'application/json',     
    },   
  };    

  const res = http.post('https://cloudlearn-ten.vercel.app/', payload, params);      

  check(res, {     
    'успішна відправка': (r: http.Response) => r.status === 201,     
    'час відповіді менше 1000мс': (r: http.Response) => r.timings.duration < 1000   
  });      

  sleep(3); 
}