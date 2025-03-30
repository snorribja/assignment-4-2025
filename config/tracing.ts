import tracer from 'dd-trace';
import StatsD from 'hot-shots';

tracer.init({service: process.env.DD_SERVICE_NAME || 'assignment-4-2025', env: process.env.NODE_ENV || 'development', version: process.env.VERSION || '1.0.0',});

const dogstatsd = new StatsD();

dogstatsd.increment('page.views');

export { tracer, dogstatsd };
