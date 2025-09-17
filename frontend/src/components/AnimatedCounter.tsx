import React from 'react';
import CountUp from 'react-countup';
import { useInView } from 'react-intersection-observer';

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  suffix = '',
  prefix = '',
  duration = 2,
  className = ''
}) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.3,
  });

  return (
    <div ref={ref} className={className}>
      {inView ? (
        <CountUp
          start={0}
          end={end}
          duration={duration}
          suffix={suffix}
          prefix={prefix}
          separator=","
          useEasing={true}
          easingFn={(t, b, c, d) => {
            // Custom easing function for smooth animation
            return c * Math.sin(t / d * (Math.PI / 2)) + b;
          }}
        />
      ) : (
        `${prefix}0${suffix}`
      )}
    </div>
  );
};

export default AnimatedCounter;