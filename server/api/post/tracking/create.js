module.exports = function (app, db_connection) {
    const CONFIG = require('../../../config.json');
    const validateInput = require('../../../utils/validateInput')();
    const validator = require('validator').default;
    const moment = require('moment');

    app.post('/api/post/tracking/create', function (request, response) {
        // check if user has permissions to update users
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

        const description = request.body.description.toString();
        let start_date = request.body.start_date;
        const status = request.body.status || 0;
        const tags = JSON.stringify(request.body.tags) || "[]";

        try {
            start_date = new Date(start_date);
        } catch (error) {
            return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
        }

        if (!start_date
            || !validator.isLength(description, { min: 0, max: 255 })
            || !validator.isLength(tags, { min: 2, max: 255 })
            || !validator.isDate(start_date)
        ) {
            return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
        }

        start_date = moment(start_date).format('YYYY-MM-DD HH:mm:ss');

        // check if user has already created a tracking by status
        db_connection.query(`SELECT id FROM tracking WHERE user_id = ? AND status = '1'`, [user_id.value], function (error, result) {
            if (error || (result && result.length > 0)) {
                return response.send({ status: 0, message: CONFIG.messages.TRACKING_FAILED });
            }

            db_connection.query('INSERT INTO tracking (user_id, description, start_date, tags, status) VALUES (?, ?, ?, ?, ?)', [user_id.value, description, start_date, tags, status], function (error, result) {
                if (error || (result && result.affectedRows === 0)) {
                    return response.send({ status: 0, message: CONFIG.messages.TRACKING_FAILED });
                }
                return response.send({ status: 1, message: CONFIG.messages.TRACKING_CREATED, tracking_id: result.insertId });
            });

        });

    });
}