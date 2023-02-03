module.exports = function (app, db_connection) {
    const CONFIG = require('../../config.json');

    app.get('/api/get/fetchUsers', (request, response) => {
        if (!request.session.user) {
            return response.send({ status: 0, message: CONFIG.messages.NOT_LOGGED_IN });
        }

        // fetch user names and tags from database that have any records in tracking
        const query = `SELECT user_id, user_name, user_tag FROM users`;

        db_connection.query(query, (error, result) => {
            if (error) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }

            return response.send({ status: 1, users: result });
        });
    });

}