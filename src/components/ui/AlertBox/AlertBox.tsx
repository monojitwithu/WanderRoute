import type { Alert } from '../../../types';
import styles from './AlertBox.module.css';

interface Props {
  alert: Alert;
}

export function AlertBox({ alert }: Props) {
  const isDanger = alert.severity === 'danger';
  const icon = isDanger ? '⚠️' : alert.severity === 'warning' ? '⛈️' : 'ℹ️';
  
  return (
    <div className={`${styles.box} ${styles[alert.severity]}`}>
      <div className={styles.iconWrap} style={{ fontSize: '1.25rem' }}>
        {icon}
      </div>
      <div className={styles.content}>
        <span className={styles.source}>{alert.source} Alert</span>
        <p className={styles.message}>{alert.message}</p>
      </div>
    </div>
  );
}
