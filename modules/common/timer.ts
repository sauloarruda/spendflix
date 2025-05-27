import getLogger from '@/common/logger';

const logger = getLogger().child({ module: 'timer' });

function Timer(name: string) {
  const start = new Date();
  return {
    stop() {
      const end = new Date();
      const time = end.getTime() - start.getTime();
      logger.debug({ time, name });
    },
  };
}

export default Timer;
