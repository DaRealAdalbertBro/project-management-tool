import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select, { components } from 'react-select';
import makeAnimated from 'react-select/animated';
import moment from 'moment';
import Axios from 'axios';

import { apiServerIp } from '../globalVariables';

import { AiFillPlayCircle, AiFillTags, AiFillPauseCircle, AiOutlineDelete } from 'react-icons/ai';

import './Tracking.css'


const animatedComponents = makeAnimated();

const DropdownIndicator = props => {
    return (
        <components.DropdownIndicator {...props}>
            <AiFillTags />
        </components.DropdownIndicator>
    );
};


const Tracking = () => {
    const [trackingHistory, setTrackingHistory] = useState([]);
    let quickIndex = 0;

    useEffect(() => {
        const controller = new AbortController();

        Axios.get(apiServerIp + "/api/get/tracking/fetch",
            {
                params: {
                    user_id: 'self',
                    daysToSelect: 30
                },
                signal: controller.signal
            })
            .then(response => {
                if (response.data.status === 1) {
                    setTrackingHistory(response.data.data);
                }
            })
            .catch(error => {
                if (error.name === 'AbortError') {
                    console.log('Aborted');
                }
                else {
                    console.log(error);
                }
            }
            );

        return () => controller.abort();
    }, []);

    return (
        <div className="tracking">
            <div className="header">
                <h2>Quick Access</h2>

                {trackingHistory.length === 0 && <Record type="quick" />}

                {trackingHistory.map((record) => {
                    if (quickIndex === 1) {
                        return null;
                    }

                    if (record.status === 1) {
                        const timeDifference = moment().diff(moment(record.start_date), 'seconds');
                        const formattedDifference = moment.utc(timeDifference * 1000).format('HH:mm:ss');
                        quickIndex++;

                        return (
                            <Record key={record.id}
                                type="quick"
                                t_description={record.description}
                                t_tags={record.tags}
                                t_start_date={moment(record.start_date).format('YYYY-MM-DDTHH:mm')}
                                t_end_date={moment().format('YYYY-MM-DDTHH:mm')}
                                t_time_difference={formattedDifference}
                                t_record={record}
                                t_status={record.status}
                            />
                        );
                    }
                })
                }
            </div>

            <div className="data-list">
                <h2>Last Month</h2>
                {
                    trackingHistory.map((record) => {
                        if (record.status !== 1) {
                            const timeDifference = moment(record.end_date).diff(moment(record.start_date), 'seconds');
                            const formattedDifference = moment.utc(timeDifference * 1000).format('HH:mm:ss');

                            return (
                                <Record
                                    key={record.id}
                                    type="history"
                                    t_description={record.description}
                                    t_tags={record.tags}
                                    t_start_date={moment(record.start_date).format('YYYY-MM-DDTHH:mm')}
                                    t_end_date={moment(record.end_date).format('YYYY-MM-DDTHH:mm')}
                                    t_time_difference={formattedDifference}
                                    t_record={record}
                                />
                            )
                        }
                    })
                }
            </div>
        </div>
    )
}

const Record = ({ type, t_description, t_tags, t_start_date, t_end_date, t_time_difference, t_status, t_record }) => {
    const navigate = useNavigate();
    const [tagOptions, setTagOptions] = useState([]);
    const [isTracking, setIsTracking] = useState(t_status);

    const createRecord = (description, startDate, tags) => {
        const controller = new AbortController();

        Axios.post(apiServerIp + '/api/post/tracking/create', {
            user_id: 'self',
            description: description,
            start_date: startDate,
            status: 1,
            tags: tags
        }, { signal: controller.signal })
            .then(response => {
                console.log(response.data)
            })
            .catch(error => {
                if (error.name === 'AbortError') {
                    console.log('Aborted');
                }
                else {
                    console.log(error);
                }
            });

        return () => controller.abort();
    }

    const updateRecord = (description, startDate, endDate, tags, status) => {
        const controller = new AbortController();

        // Axios.post(apiServerIp + '/api/post/tracking/update', {
        //     user_id: 'self',
        //     description: description,
        //     start_date: startDate,
        //     end_date: endDate,
        //     status: status,
        //     tags: tags
        // }, { signal: controller.signal })
        //     .then(response => {
        //         if (response.data.status === 1) {
        //             window.location.reload();
        //         }
        //     })
        //     .catch(error => {
        //         if (error.name === 'AbortError') {
        //             console.log('Aborted');
        //         }
        //         else {
        //             console.log(error);
        //         }
        //     });

        return () => controller.abort();
    }

    const deleteRecord = (id) => {
        const controller = new AbortController();

        Axios.post(apiServerIp + '/api/post/tracking/delete', {
            tracking_id: id
        }, { signal: controller.signal })
            .then(response => {
                if (response.data.status === 1) {
                    window.location.reload();
                }
            })
            .catch(error => {
                if (error.name === 'AbortError') {
                    console.log('Aborted');
                }
                else {
                    console.log(error);
                }
            });

        return () => controller.abort();
    }

    const getQuickAccessTags = () => {
        let tags = [];

        document.querySelectorAll('.quick .react-select__multi-value__label').forEach((tag) => {
            tags.push(tag.innerText);
        });

        return tags;
    }

    const handleTimeChange = (time, label) => {
        if (time === null || time === undefined) {
            time = t_start_date || moment().format('YYYY-MM-DDTHH:mm');
        }
        if (label === null || label === undefined) {
            label = document.querySelector('.quick label.time');
        }

        // add seconds to the t_start_date
        let startTime = moment((time.value || time) + ":" + label.dataset.startedAtSeconds).toDate();
        const currentTime = moment().toDate();
        let diff = currentTime - startTime;

        if (diff < 0) {
            startTime.setDate(startTime.getDate() - 1);
            diff = currentTime - startTime;

            if (diff < 0) {
                time.value = moment().format('YYYY-MM-DDTHH:mm');
                label.innerText = "00:00:00";
                return;
            }
            else time.value = moment(startTime).format('YYYY-MM-DDTHH:mm');
        }

        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor(diff / 1000 / 60) - (hours * 60);
        const seconds = Math.floor(diff / 1000) - (hours * 60 * 60) - (minutes * 60);

        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        label.innerText = formattedTime;
    }

    useEffect(() => {
        if (type !== 'quick') return;

        const label = document.querySelector('.quick label.time');

        if (isTracking) {
            // set number of seconds in a minute
            label.style.opacity = '1';

            label.dataset.startedAtSeconds = (t_record && moment(t_record.start_date).format('ss')) || moment().format('ss');

            if (t_status !== 1) {
                createRecord(
                    document.querySelector('.quick input.descriptionInput').value,
                    document.querySelector('.quick input.startDate').value + ":" + label.dataset.startedAtSeconds,
                    getQuickAccessTags()
                );
            }
        }
        else {
            label.style.opacity = '0.4';
        }

        const interval = setInterval(() => {
            if (isTracking) {
                handleTimeChange(null, label);
            }
        }, 1000);

        return () => clearInterval(interval);

    }, [type, isTracking, t_status, t_record]);

    useEffect(() => {
        document.title = "Tracking | Void";
        setTagOptions([
            { value: 'Tag 1', label: 'Tag 1' },
            { value: 'Tag 2', label: 'Tag 2' },
            { value: 'Tag 3', label: 'Tag 3' },
            { value: 'Tag 4', label: 'Tag 4' },
            { value: 'Tag 5', label: 'Tag 5' },
            { value: 'Tag 6', label: 'Tag 6' },
        ]);

        if (type !== 'quick') return;
        document.querySelector('.quick input.startDate').value = moment(t_start_date).format('YYYY-MM-DD HH:mm');
    }, [navigate, type, t_start_date]);

    return (
        <div className={"box " + type}>
            <div className="description">
                <input className="descriptionInput" type="text" placeholder="Enter description" maxLength={255} defaultValue={t_description || ""} />
            </div>

            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '2rem',
            }}>

                <div className="tags">
                    <Select
                        id="tags-dropdown"
                        closeMenuOnSelect={false}
                        components={{ animatedComponents, DropdownIndicator }}
                        isMulti
                        options={tagOptions}
                        className="react-select-container"
                        classNamePrefix="react-select"
                        placeholder=""
                        defaultValue={(t_tags && JSON.parse(t_tags).map((tag) => {
                            return { value: tag, label: tag };
                        })) || []}
                        styles={{
                            control: base => ({
                                ...base,
                                border: 0,
                                // This line disable the blue border
                                boxShadow: 'none',
                                display: 'flex',
                                justifyContent: 'right',
                            }),
                            option: (provided) => ({
                                ...provided,
                                backgroundColor: 'var(--divider-gray)',
                                ':hover': {
                                    backgroundColor: 'var(--blue)',
                                },
                            }),
                            multiValue: (provided) => ({
                                ...provided,
                                backgroundColor: 'var(--divider-gray)',
                            }),
                            multiValueLabel: (provided) => ({
                                ...provided,
                                color: 'white',
                            }),
                            multiValueRemove: (provided) => ({
                                ...provided,
                                color: 'white',
                                cursor: 'pointer',
                            }),
                            dropdownIndicator: base => ({
                                ...base,
                                fontSize: '1.3rem',
                                cursor: 'pointer',
                                ':hover': {
                                    color: 'var(--blue)',
                                }
                            }),
                            clearIndicator: base => ({
                                ...base,
                                display: 'none',
                            }),
                            indicatorSeparator: base => ({
                                ...base,
                                display: 'none',
                            }),
                        }}
                    />

                </div>

                <div className="duration">
                    {type && type.includes("quick") &&
                        < input type="datetime-local" className="startDate" defaultValue={t_start_date} onChange={(event) => {
                            handleTimeChange(event.target, event.target.parentElement.querySelector('label'));
                        }} />
                    }
                    {type && !type.includes("quick") ?
                        <input className="time" type="text" placeholder="00:00:00" defaultValue={t_time_difference} onBlur={(event) => {
                            const regex = /^(0\d|1\d|2[0-3]):[0-5]\d:[0-5]\d$/;
                            if (!regex.test(event.target.value)) {
                                event.target.value = t_time_difference;
                            }
                        }} />
                        :
                        <label className="time">{t_time_difference || "00:00:00"}</label>
                    }

                    {type && !type.includes("quick") &&
                        <button className="deleteButton" onClick={(event) => {
                            event.preventDefault();
                            deleteRecord(t_record.id)

                        }} >
                            <AiOutlineDelete />
                        </button>
                    }
                </div>

                {type && type.includes("quick") &&
                    <button className="startButton" onClick={(event) => {
                        event.preventDefault();

                        if (isTracking) {
                            updateRecord(
                                document.querySelector('.quick input.descriptionInput').value,
                                document.querySelector('.quick input.startDate').value + ":" + document.querySelector('.quick label.time').dataset.startedAtSeconds,
                                moment().format('YYYY-MM-DDTHH:mm:ss'),
                                document.querySelector('.quick #tags-dropdown').value,
                                0
                            );
                        }

                        setIsTracking(!isTracking);

                    }} >
                        {isTracking ? <AiFillPauseCircle /> : <AiFillPlayCircle />}
                    </button>}
            </div>
        </div>
    )
};

export default Tracking;