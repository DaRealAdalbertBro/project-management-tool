import React, { useEffect, useState } from 'react';
import Axios from 'axios';
import { apiServerIp, globalTags } from '../../globalVariables';

import { Record, SelectStyles } from '../Tracking';
import moment from 'moment';

import Select, { components } from 'react-select';
import makeAnimated from 'react-select/animated';

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

    useEffect(() => {
        const controller = new AbortController();
        console.log(selectedDayInterval)

        Axios.get(apiServerIp + "/api/get/tracking/fetchByFilter",
            {
                params: {
                    user_id: selectedAuthors.length > 0 ? selectedAuthors.map(user => user.value) : authorOptions.map(user => user.user_id),
                    daysInterval: selectedDayInterval,
                    recordsToSelect: 30,
                    tags: selectedTags.map(tag => tag.value),
                },
                signal: controller.signal
            })
            .then(response => {
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
    }, [selectedTags, selectedAuthors, authorOptions, selectedDayInterval]);

    useEffect(() => {
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
        <div className="tracking">
            <div className="data-list">

                {/* filters */}
                <div className="filters">
                    <div className="filter">
                        {/* select dropdown for last week, this month, last month, this year, last year */}
                        <Select
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
                        {/* by author */}
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
                </div>



                <h1>All Tracking Records</h1>

                {trackingHistory.map((record) => {
                    const timeDifference = moment(record.end_date).diff(moment(record.start_date), 'seconds');
                    const formattedDifference = moment.utc(timeDifference * 1000).format('HH:mm:ss');

                    return (
                        <Record
                            type="history"
                            key={record.id}
                            t_record={record}
                            t_description={record.description}
                            t_start_date={moment(record.start_date).format('YYYY-MM-DDTHH:mm')}
                            t_time_difference={formattedDifference}
                            t_tags={record.tags}
                            t_status={record.status}
                            t_score={record.score}
                        />
                    )
                })}
            </div>
        </div>
    );
}


export default Records;