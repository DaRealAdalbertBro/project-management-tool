import Axios from 'axios';
import { UpdateCustomPopup } from '../CustomPopup';
import { apiServerIp } from '../globalVariables';

export const createRecord = (description, startDate, tags, setTracking_id, popupContext) => {
    const controller = new AbortController();

    Axios.post(apiServerIp + '/api/post/tracking/create', {
        user_id: 'self',
        description: description,
        start_date: startDate,
        status: 1,
        tags: tags
    }, { signal: controller.signal })
        .then(response => {
            if (response.data.status === 1) {
                setTracking_id(response.data.tracking_id);
                return;
            }

            // show error popup
            UpdateCustomPopup(popupContext.active,
                popupContext.title,
                [
                    (response.data && response.data.message) || popupContext.message[0],
                    popupContext.message[1]
                ]
            );
        })
        .catch(error => {
            if (error.name === 'CanceledError') {
                console.log('Aborted');
            }
            else {
                console.log(error);
            }
        });

    return () => controller.abort();
}

export const updateRecord = (data, t_record, tracking_id, popupContext, reload = false) => {
    const controller = new AbortController();
    const id = t_record ? t_record.id : tracking_id;

    if (!id || !data) return;
    const { description, start_date, end_date, tags, status, user_id, new_user_id, score } = data;

    Axios.post(apiServerIp + '/api/post/tracking/update', {
        user_id: user_id || (t_record && t_record.user_id) || 'self',
        new_user_id: new_user_id,
        tracking_id: id,
        description: description,
        start_date: start_date,
        end_date: end_date,
        tags: JSON.stringify(tags),
        status: status,
        score: score,
    }, { signal: controller.signal })
        .then(response => {
            if (response.data.status === 1 && reload) {
                window.location.reload();
                return;
            } else if (response.data.status === 1) {
                return;
            }

            // show error popup
            UpdateCustomPopup(popupContext.active,
                popupContext.title,
                [
                    (response.data && response.data.message) || popupContext.message[0],
                    popupContext.message[1]
                ]
            );
        })
        .catch(error => {
            if (error.name === 'CanceledError') {
                console.log('Aborted');
            }
            else {
                console.log(error);
            }
        });

    return () => controller.abort();
}

export const deleteRecord = (t_record, popupContext, reload = true) => {
    const controller = new AbortController();

    if (!t_record) return;

    Axios.post(apiServerIp + '/api/post/tracking/delete', {
        tracking_id: t_record.id,
        user_id: t_record.user_id || 'self',
    }, { signal: controller.signal })
        .then(response => {
            if (response.data.status === 1 && reload) {
                window.location.reload();
                return;
            } else if (response.data.status === 1) {
                return;
            }

            // show error popup
            UpdateCustomPopup(popupContext.active,
                popupContext.title,
                [
                    (response.data && response.data.message) || popupContext.message[0],
                    popupContext.message[1]
                ]
            );
        })
        .catch(error => {
            if (error.name === 'CanceledError') {
                console.log('Aborted');
            }
            else {
                console.log(error);
            }
        });

    return () => controller.abort();
}

export const handleStarClick = (event, setCurrentScore, t_record, tracking_id) => {
    const scoreInput = event.target.closest('.score').querySelector('input[type="number"]');

    if (scoreInput === undefined || scoreInput === null) return;

    let value = scoreInput.value;
    if (value === undefined || value === null) return;

    if (value === '0') {
        scoreInput.value = 5;
    } else {
        scoreInput.value = 0;
    }

    setCurrentScore(scoreInput.value);
    updateRecord({
        score: parseInt(scoreInput.value)
    }, t_record, tracking_id);
}

export const fetchByFilter = (options) => {
    const controller = new AbortController();
    Axios.get(apiServerIp + "/api/get/tracking/fetchByFilter",
        {
            params: {
                user_id: options.selectedAuthors.length > 0 ? options.selectedAuthors.map(user => user.value) : options.authorOptions.map(user => user.user_id),
                daysInterval: options.selectedDayInterval,
                recordsToSelect: 30,
                tags: options.selectedTags.map(tag => tag.value),
                numOfStarsFilter: options.numOfStarsFilter
            },
            signal: controller.signal
        })
        .then(response => {
            if (response.data.status === 1) {
                options.setTrackingHistory(response.data.data);
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
}