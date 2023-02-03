import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { apiServerIp, globalTags } from '../../globalVariables';

import { Record, SelectStyles } from '../Tracking';
import moment from 'moment';

import Select, { components } from 'react-select';
import makeAnimated from 'react-select/animated';

import Checkbox from '../../Checkbox';
import { CustomPopup } from '../../CustomPopup';

// TODO
// aby mohli vybirat cas podle datumu, ne podle cisilek 00:00:00
// zprovoznit filtry
// pridat kategorie a barvicky


const Records = () => {
    const [trackingHistory, setTrackingHistory] = useState([]);
    const [tagOptions, setTagOptions] = useState(globalTags);
    const [authorOptions, setAuthorOptions] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedAuthors, setSelectedAuthors] = useState([]);
    const [selectedDayInterval, setSelectedDayInterval] = useState([]);
    const [shouldShowDateFilter, setShouldShowDateFilter] = useState(false);
    const [numOfStarsFilter, setNumOfStarsFilter] = useState(null);

    // set popup variables
    const [popupActive, setPopupActive] = useState(false);
    const [popupTitle, setPopupTitle] = useState("Warning");
    const [popupMessage, setPopupMessage] = useState("Something went wrong... Try again later!");

    // declare popup context
    // this is used to pass popup variables to other components
    const popupContext = {
        active: [popupActive, setPopupActive],
        title: [popupTitle, setPopupTitle],
        message: [popupMessage, setPopupMessage],
    };

    useEffect(() => {
        const controller = new AbortController();
        Axios.get(apiServerIp + "/api/get/tracking/fetchByFilter",
            {
                params: {
                    user_id: selectedAuthors.length > 0 ? selectedAuthors.map(user => user.value) : authorOptions.map(user => user.user_id),
                    daysInterval: selectedDayInterval,
                    recordsToSelect: 30,
                    tags: selectedTags.map(tag => tag.value),
                    numOfStarsFilter: numOfStarsFilter
                },
                signal: controller.signal
            })
            .then(response => {
                console.log(response.data)
                if (response.data.status === 1) {
                    setTrackingHistory(response.data.data);
                }
            })
            .catch(error => {
                if (error.name === 'CanceledError') {
                    console.log('Aborted');
                }
                else {
                    console.log(error);
                }
            }
            );

        return () => controller.abort();
    }, [selectedTags, selectedAuthors, authorOptions, selectedDayInterval, numOfStarsFilter]);

    useEffect(() => {
        document.title = "Records | Void";

        const controller = new AbortController();

        Axios.get(apiServerIp + "/api/get/fetchUsers",
            {
                signal: controller.signal
            })
            .then(response => {
                console.log(response)
                if (response.data.status === 1) {
                    setAuthorOptions(response.data.users);
                }
            })
            .catch(error => {
                if (error.name === 'CanceledError') {
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
        <div className="tracking records">
            {popupActive && <CustomPopup title={popupTitle} message={popupMessage} setActive={setPopupActive} />}
            <div className="data-list">

                <h2>Filters:</h2>
                {/* filters */}
                <div className="filters">
                    <div className="filter">
                        {/* select dropdown for last week, this month, last month, this year, last year */}
                        <Select
                            // make this week default
                            defaultValue={{
                                value: [
                                    moment().startOf('week').format('YYYY-MM-DD'),
                                    moment().endOf('week').format('YYYY-MM-DD')
                                ], label: 'This Week'
                            }}
                            options={[
                                {
                                    value: [
                                        moment().startOf('week').format('YYYY-MM-DD'),
                                        moment().endOf('week').format('YYYY-MM-DD')
                                    ], label: 'This Week'
                                },
                                {
                                    value: [
                                        moment().subtract(1, 'week').startOf('week').format('YYYY-MM-DD'),
                                        moment().subtract(1, 'week').endOf('week').format('YYYY-MM-DD')
                                    ], label: 'Last Week'
                                },
                                {
                                    value: [
                                        moment().startOf('month').format('YYYY-MM-DD'),
                                        moment().endOf('month').format('YYYY-MM-DD')
                                    ], label: 'This Month'
                                },
                                {
                                    value: [
                                        moment().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
                                        moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
                                    ], label: 'Last Month'
                                },
                                {
                                    value: [
                                        moment().startOf('year').format('YYYY-MM-DD'),
                                        moment().endOf('year').format('YYYY-MM-DD')
                                    ], label: 'This Year'
                                },
                                {
                                    value: [
                                        moment().subtract(1, 'year').startOf('year').format('YYYY-MM-DD'),
                                        moment().subtract(1, 'year').endOf('year').format('YYYY-MM-DD')
                                    ], label: 'Last Year'
                                },
                            ]}
                            components={makeAnimated()}
                            isSearchable
                            isClearable
                            placeholder="Select time period"
                            className="react-select-container"
                            classNamePrefix="react-select"
                            styles={SelectStyles}
                            onChange={(selected) => setSelectedDayInterval(selected.value)}
                        />
                    </div>

                    <div className="filter">
                        <Select
                            id="tags-filter"
                            closeMenuOnSelect={false}
                            components={{ animatedComponents: makeAnimated() }}
                            isMulti
                            options={tagOptions}
                            className="react-select-container"
                            classNamePrefix="react-select"
                            placeholder="Tag Filter"
                            styles={SelectStyles}
                            onChange={(selected) => setSelectedTags(selected)}
                        />
                    </div>

                    <div className="filter">
                        <Select
                            id="author-filter"
                            closeMenuOnSelect={false}
                            components={{ animatedComponents: makeAnimated() }}
                            isMulti
                            options={
                                authorOptions.map((author) => {
                                    const name = author.user_name + "#" + author.user_tag;

                                    return { value: author.user_id, label: name }
                                }
                                )
                            }
                            className="react-select-container"
                            classNamePrefix="react-select"
                            placeholder="Author Filter"
                            styles={SelectStyles}
                            onChange={(selected) => setSelectedAuthors(selected)}
                        />
                    </div>

                    <div className="filter star">
                        <label htmlFor="num-of-stars">Number of Stars:</label>

                        <input type="number" min="0" max="5" maxLength={1} defaultValue={numOfStarsFilter} onChange={(e) => {
                            if (e.target.value < 0 || e.target.value > 5) {
                                e.target.value = numOfStarsFilter;
                            } else {
                                setNumOfStarsFilter(e.target.value);
                            }
                        }} />
                    </div>


                    <div className="filter date">
                        {/* checkbox if start and date should be shown */}
                        <label htmlFor="show-dates">Show Dates</label>
                        <Checkbox
                            type="checkbox"
                            id="show-dates"
                            name="show-dates"
                            checked={shouldShowDateFilter}
                            onChange={() => setShouldShowDateFilter(!shouldShowDateFilter)}
                        />
                    </div>
                </div>

                <h2>Records:</h2>

                {trackingHistory.map((record) => {
                    let difference = moment.duration(moment(record.end_date).diff(moment(record.start_date)));
                    const hours = difference.hours() + (difference.days() * 24);
                    const minutes = difference.minutes();
                    const seconds = difference.seconds();
                    let formattedDifference = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                    let showDate = (shouldShowDateFilter && record.status === 0) ? true : false;

                    return (
                        <Record
                            type="history record"
                            key={record.id}
                            t_record={record}
                            t_description={record.description}
                            t_start_date={moment(record.start_date).format('YYYY-MM-DDTHH:mm')}
                            t_end_date={moment(record.end_date).format('YYYY-MM-DDTHH:mm')}
                            t_time_difference={formattedDifference}
                            t_tags={record.tags}
                            t_status={record.status}
                            t_score={record.score}
                            t_show_date={showDate}
                            popupContext={popupContext}
                        />
                    )
                })}
            </div>
        </div>
    );
}


export default Records;