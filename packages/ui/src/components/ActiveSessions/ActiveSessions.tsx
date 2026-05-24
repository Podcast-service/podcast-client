import React from "react";
import styles from "./ActiveSessions.module.css";

import ActiveSesSvg from "../../assets/icons/activeSes.svg";

interface SessionItem {
    id: string;
    deviceName: string;
    deviceInfo: string;
    ipAddress: string;
    lastActivity: string;
    isCurrent?: boolean;
}

interface ActiveSessionsProps {
    sessions: SessionItem[];
}

const ActiveSessions: React.FC<ActiveSessionsProps> = ({ sessions }) => {
    return (
        <section className={styles.sessions}>
            <div className={styles.header}>
                <div className={styles.titleRow}>
                    <img
                        src={ActiveSesSvg}
                        alt=""
                        aria-hidden="true"
                        className={styles.titleIcon}
                    />

                    <h2 className={styles.title}>Активные сессии</h2>
                </div>

                <p className={styles.description}>
                    Список устройств, на которых вы выполнили вход в аккаунт.
                </p>
            </div>

            <div className={styles.table}>
                <div className={styles.tableHead}>
                    <div className={styles.cell}>Устройство</div>
                    <div className={styles.cell}>IP-адрес</div>
                    <div className={styles.cell}>Последняя активность</div>
                    <div className={styles.cell}>Действие</div>
                </div>

                {sessions.map((session) => (
                    <div key={session.id} className={styles.tableRow}>
                        <div className={styles.deviceCell}>
                            <span className={styles.deviceName}>
                                {session.deviceName}
                            </span>

                            <span className={styles.deviceInfo}>
                                {session.deviceInfo}
                            </span>
                        </div>

                        <div className={styles.cell}>{session.ipAddress}</div>

                        <div className={styles.cell}>
                            {session.lastActivity}
                        </div>

                        <div className={styles.cell}>
                            <span
                                className={
                                    session.isCurrent
                                        ? styles.currentStatus
                                        : styles.activeStatus
                                }
                            >
                                {session.isCurrent
                                    ? "Текущая сессия"
                                    : "Активна"}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default ActiveSessions;