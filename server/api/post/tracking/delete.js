module.exports = function (app, db_connection) {
    const CONFIG = require('../../../config.json');
    const validator = require('validator').default;
    const validateInput = require('../../../utils/validateInput')();

    app.post('/api/post/tracking/delete', function (request, response) {
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

        let tracking_id = validator.escape(request.body.tracking_id.toString());

        if (!tracking_id) {
            return response.send({ status: 0, message: CONFIG.messages.USER_NOT_FOUND });
        }

        try {
            tracking_id = parseInt(tracking_id);
        } catch (error) {
            return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
        }

        db_connection.query('DELETE FROM tracking WHERE id = ? AND user_id = ?', [tracking_id, user_id.value], function (error, result) {
            if (error || (result && result.affectedRows === 0)) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }

            return response.send({ status: 1, message: CONFIG.messages.TRACKING_DELETED });
        });

    });
}