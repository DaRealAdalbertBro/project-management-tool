import Axios from 'axios';
import { apiServerIp } from '../globalVariables';

export const createRecord = (description, startDate, tags, setTracking_id) => {
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
            }
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

export const updateRecord = (data, t_record, tracking_id, reload = false) => {
    const controller = new AbortController();
    const id = t_record ? t_record.id : tracking_id;
    
    // , description, startDate, endDate, tags, status, 
    if (!id || !data) return;

    const { description, start_date, end_date, tags, status, user_id, score } = data;

    Axios.post(apiServerIp + '/api/post/tracking/update', {
        user_id: user_id || 'self',
        tracking_id: id,
        description: description,
        start_date: start_date,
        end_date: end_date,
        tags: JSON.stringify(tags),
        status: status,
        score: score,
    }, { signal: controller.signal })
        .then(response => {
            console.log(response)
            if (response.data.status === 1 && reload) {
                window.location.reload();
            }
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

export const deleteRecord = (id) => {
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
            if (error.name === 'CanceledError') {
                console.log('Aborted');
            }
            else {
                console.log(error);
            }
        });

    return () => controller.abort();
}

export const getTags = (target) => {
    let tags = [];

    if (target === null || target === undefined) {
        target = document.querySelectorAll('.quick .react-select__multi-value__label');

        if (target == null) return;
    }

    if (typeof target.forEach !== 'function') {
        tags.push(target.textContent);
        return tags;
    }

    target.forEach((tag) => {
        tags.push(tag.textContent);
    });

    return tags;
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