import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select, { components } from 'react-select';
import makeAnimated from 'react-select/animated';
import moment from 'moment';

import { AiFillPlayCircle, AiFillTags, AiFillPauseCircle } from 'react-icons/ai';

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

    return (
        <div className="tracking">
            <div className="header">
                <h2>Quick Access</h2>

                <Record type="quick" />
            </div>

            <div className="data-list">

            </div>
        </div>
    )
}

const Record = ({ type }) => {
    const navigate = useNavigate();
    const [tagOptions, setTagOptions] = useState([]);
    const [isTracking, setIsTracking] = useState(false);

    useEffect(() => {
        const label = document.querySelector('.quick label.time');

        if (isTracking) {
            // set number of seconds in a minute
            label.style.opacity = '1';
            label.dataset.startedAtSeconds = moment().format('ss');
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

    }, [isTracking]);

    useEffect(() => {
        document.title = "Tracking | Void";
        setTagOptions([
            { value: 'tag1', label: 'Tag 1' },
            { value: 'tag2', label: 'Tag 2' },
            { value: 'tag3', label: 'Tag 3' },
            { value: 'tag4', label: 'Tag 4' },
            { value: 'tag5', label: 'Tag 5' },
            { value: 'tag6', label: 'Tag 6' },
            { value: 'tag7', label: 'Tag 7' },
            { value: 'tag8', label: 'Tag 8' },
            { value: 'tag9', label: 'Tag 9' },
            { value: 'tag10', label: 'Tag 10' },
            { value: 'tag11', label: 'Tag 11' },
            { value: 'tag12', label: 'Tag 12' },
            { value: 'tag13', label: 'Tag 13' },
        ]);

        document.querySelector('input.startDate').value = moment().format('YYYY-MM-DDTHH:mm');

    }, [navigate]);

    const handleTimeChange = (time, label) => {
        if (time === null) {
            time = document.querySelector('.quick input.startDate');
        }
        if (label === null) {
            label = document.querySelector('.quick label.time');
        }

        let startTime = moment(time.value + ":" + label.dataset.startedAtSeconds).toDate();
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

        // respect number of seconds in a minute in diff
        if (time.dataset.start !== undefined) {
            startTime = moment(time.dataset.start).toDate();
            diff = currentTime - startTime;
        }

        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor(diff / 1000 / 60) - (hours * 60);
        const seconds = Math.floor(diff / 1000) - (hours * 60 * 60) - (minutes * 60);

        const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        label.innerText = formattedTime;
    }

    return (
        <div className={"box " + type}>
            <div className="description">
                <input type="text" placeholder="Enter description" maxLength={255} />
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

                    {/* format datetime-local to show only time  */}
                    <input type="datetime-local" className="startDate" onChange={(event) => {
                        handleTimeChange(event.target, event.target.parentElement.querySelector('label'));
                    }} />

                    {!type.includes("quick") && <input type="datetime-local" className="endDate" />}

                    <label htmlFor="startDate" className="time">00:00:00</label>
                </div>

                <button className="startButton" onClick={(event) => {
                    event.preventDefault();

                    setIsTracking(!isTracking);
                }} >
                    {isTracking ? <AiFillPauseCircle /> : <AiFillPlayCircle />}
                </button>
            </div>
        </div>
    )
};

export default Tracking;