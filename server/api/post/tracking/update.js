module.exports = function (app, db_connection) {
    const CONFIG = require('../../../config.json');
    const validator = require('validator');
    const moment = require('moment');
    const validateInput = require('../../../utils/validateInput')();
    
    app.post('/api/post/tracking/update', function (request, response) {
        if (!request.session.user) {
            return response.send({ status: 0, message: CONFIG.messages.NOT_LOGGED_IN });
        }
        
        let user_id = validateInput.isUserIdValid(request.body.user_id);
        
        if (user_id.value === "self" || !user_id.value) {
            user_id = validateInput.isUserIdValid(request.session.user.user_id);
        }

        if (!user_id.status) {
            return response.send({ status: 0, message: CONFIG.messages.USER_NOT_FOUND });
        }

        let tracking_id = request.body.tracking_id;
        let description = request.body.description;
        let startDate = request.body.start_date;
        let endDate = request.body.end_date;
        let status = request.body.status;
        let tags = request.body.tags;
        let score = request.body.score;
        let new_user_id = request.body.new_user_id;

        if (!tracking_id || (!tracking_id && !description && !startDate && !endDate && !status && !tags && !score && !new_user_id)) {
            return response.send({ status: 0, message: CONFIG.messages.NOTHING_TO_UPDATE });
        }

        const updateObject = {};

        if (description !== undefined) {
            description = validator.escape(description);
            updateObject.description = description;
        }

        if (startDate !== undefined) {
            try {
                startDate = new Date(startDate);
                updateObject.start_date = startDate;
            } catch (error) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }
        }

        if (endDate !== undefined) {
            try {
                endDate = new Date(endDate);
                updateObject.end_date = endDate;
            } catch (error) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }
        }

        if (status !== undefined) {
            if (isNaN(status) || status < 0 || status > 1) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }

            updateObject.status = status;

            if (!endDate && status == 0) {
                updateObject.end_date = new Date();
            }
            
            if (!startDate && status == 0) {
                updateObject.start_date = new Date();
            }
        }

        if (tags !== undefined) {
            // check if is valid json string
            try {
                tags = JSON.parse(tags);
                updateObject.tags = JSON.stringify(tags);
            } catch (error) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }

            for (let i = 0; i < tags.length; i++) {
                if (typeof tags[i] !== 'string') {
                    tags.splice(i, 1);
                }
            }
        }

        if (score !== undefined) {
            if (isNaN(score) || score < 0 || score > 5) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }

            updateObject.score = score;
        }

        if ((startDate && !validator.isDate(startDate))
        || (endDate && !validator.isDate(endDate))) {
            return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
        }

        if (startDate && endDate && startDate > endDate) {
            return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
        }
        new_user_id = validateInput.isUserIdValid(new_user_id);
        if (new_user_id.status) {
            updateObject.user_id = new_user_id.value;
        }

        db_connection.query('UPDATE tracking SET ? WHERE id = ? AND user_id = ?', [updateObject, tracking_id, user_id.value], function (error, result) {
            if (error || (result && result.affectedRows === 0)) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }

            return response.send({ status: 1, message: CONFIG.messages.TRACKING_UPDATED });
        });

    });
}