module.exports = function (app, db_connection) {
    const CONFIG = require("../../../config.json");
    const validateInput = require('../../../utils/validateInput')();
    const validator = require("validator").default;

    app.get("/api/get/tracking/fetch", (request, response) => {
        // check if user has permissions to update users
        if (!request.session.user) {
            return response.send({ status: 0, message: CONFIG.messages.NOT_LOGGED_IN });
        }

        let user_id = validateInput.isUserIdValid(request.query.user_id);
        let daysToSelect = validator.escape(request.query.daysToSelect) || 30;

        if (daysToSelect < 0 || daysToSelect > 365) {
            daysToSelect = 30;
        }

        if (user_id.value === "self" || !user_id.value) {
            user_id = validateInput.isUserIdValid(request.session.user.user_id);
        }

        if (!user_id.status) {
            return response.send({ status: 0, message: CONFIG.messages.USER_NOT_FOUND });
        }

        db_connection.query("SELECT * FROM tracking WHERE user_id = ? AND start_date > now() - INTERVAL ? DAY ORDER BY start_date DESC", [user_id.value, daysToSelect], (error, result) => {
            if (error || (result && result.affectedRows === 0)) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }

            // get user id username and tag
            db_connection.query("SELECT user_name, user_tag, user_avatar_url FROM users WHERE user_id = ?", [user_id.value], (error, result2) => {
                if (error || (result2 && result2.affectedRows === 0)) {
                    return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
                }

                result.forEach((record) => {
                    record.author = {
                        user_name: result2[0].user_name,
                        user_tag: result2[0].user_tag,
                        user_avatar_url: result2[0].user_avatar_url
                    }
                });

                return response.send({ status: 1, message: CONFIG.messages.TRACKING_FETCHED, data: result });
            });
        });
    });
}