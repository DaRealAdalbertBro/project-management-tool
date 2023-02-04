module.exports = function (app, db_connection) {
    const CONFIG = require("../../../config.json");
    const validateInput = require('../../../utils/validateInput')();
    const validator = require("validator").default;
    const moment = require("moment");

    app.get("/api/get/tracking/fetchByFilter", (request, response) => {
        // check if user has permissions to update users
        if (!request.session.user) {
            return response.send({ status: 0, message: CONFIG.messages.NOT_LOGGED_IN });
        }

        let user_id = request.query.user_id;
        let recordsToSelect = validator.escape(request.query.recordsToSelect) || 30;
        let tags = request.query.tags;
        let daysInterval = request.query.daysInterval;
        let numOfStarsFilter = request.query.numOfStarsFilter;

        if (recordsToSelect < 0 || recordsToSelect > 365) {
            recordsToSelect = 30;
        }

        const filterOptions = {};

        if (user_id !== undefined && user_id.length > 0) {
            if (!Array.isArray(user_id)) {
                user_id = user_id.split(",");
            }

            if (user_id.length === 0) {
                return response.send({ status: 0, message: CONFIG.messages.USER_NOT_FOUND });
            }

            user_id.forEach((id, index) => {
                if (id == 'self') {
                    id = request.session.user.user_id;
                }

                id = validateInput.isUserIdValid(id);

                if (!id.status) {
                    user_id.splice(index, 1);
                    return;
                }

                user_id[index] = id.value;
            });

            filterOptions.user_id = user_id;
        }

        if (daysInterval !== undefined && daysInterval !== null) {
            if (!Array.isArray(daysInterval)) {
                daysInterval = daysInterval.split(",");
            }

            if (daysInterval.length === 2) {
                try {
                    daysInterval[0] = moment(daysInterval[0]).format('YYYY-MM-DD HH:mm:ss');
                    daysInterval[1] = moment(daysInterval[1]).format('YYYY-MM-DD HH:mm:ss');
                }
                catch (error) {
                    daysInterval = null;
                }

                if (daysInterval !== null) {
                    filterOptions.daysInterval = daysInterval;
                } else {
                    filterOptions.daysInterval = [
                        moment().startOf('week').format('YYYY-MM-DD HH:mm:ss'),
                        moment().endOf('week').format('YYYY-MM-DD HH:mm:ss')
                    ];
                }

                if (daysInterval[0] > daysInterval[1]) {
                    filterOptions.daysInterval = [daysInterval[1], daysInterval[0]];
                }
            }

        }
        if (!filterOptions.daysInterval
            || filterOptions.daysInterval.length !== 2
            || filterOptions.daysInterval[0] > filterOptions.daysInterval[1]) {
            filterOptions.daysInterval = [
                moment().startOf('week').format('YYYY-MM-DD HH:mm:ss'),
                moment().endOf('week').format('YYYY-MM-DD HH:mm:ss')
            ];
        }


        if (numOfStarsFilter !== undefined && numOfStarsFilter !== null) {
            try {
                numOfStarsFilter = parseInt(numOfStarsFilter);
            } catch (error) {
                numOfStarsFilter = -1;
            }

            if (isNaN(numOfStarsFilter) || numOfStarsFilter < 0 || numOfStarsFilter > 5) {
                numOfStarsFilter = -1;
            }

            if (numOfStarsFilter !== -1) {
                filterOptions.numOfStarsFilter = numOfStarsFilter.toString();
            }
        }

        try {
            filterOptions.recordsToSelect = parseInt(recordsToSelect);
        } catch (error) {
            filterOptions.recordsToSelect = 30;
        }


        if (tags && tags.length > 0) {
            if (!Array.isArray(tags)) {
                tags = tags.split(",");
            }

            tags.forEach((tag, index) => {
                tags[index] = validator.escape(tag);

                if (tags[index] === "") {
                    tags.splice(index, 1);
                }
            });

            filterOptions.tags = tags;
        }

        let tagFilterQuery = "";
        let tagFilterValues = [];

        if (filterOptions.tags) {
            filterOptions.tags.forEach((tag, index) => {
                if (tag === "") {
                    filterOptions.tags.splice(index, 1);
                    return;
                }

                tagFilterQuery += `tags LIKE ? AND `;
                // escape tag from characters like # or + or ++, etc
                tagFilterValues.push(`%${tag}%`);
            })

            tagFilterQuery = tagFilterQuery.slice(0, -4);

            if (filterOptions.tags.length === 0) {
                tagFilterQuery = "";
                tagFilterValues = [];
            }

            if (filterOptions.tags.length > 0) {
                tagFilterQuery = `AND (${tagFilterQuery})`;
            }
        }


        let dayFilterQuery = "";
        let dayFilterValues = [];

        if (filterOptions.daysInterval) {
            dayFilterQuery = `AND start_date BETWEEN ? AND ?`;
            dayFilterValues = [filterOptions.daysInterval[0], filterOptions.daysInterval[1]];
        }

        let starFilterQuery = "";
        let starFilterValues = [];
        if (filterOptions.numOfStarsFilter) {
            starFilterQuery = `AND score = ?`;
            starFilterValues = [filterOptions.numOfStarsFilter];
        }

        let query = `SELECT * FROM tracking WHERE user_id IN (?) ${tagFilterQuery} ${dayFilterQuery} ${starFilterQuery} ORDER BY start_date DESC LIMIT ?`;
        let values = [filterOptions.user_id, ...tagFilterValues, ...dayFilterValues, ...starFilterValues, filterOptions.recordsToSelect];

        db_connection.query(query, values, (error, result) => {
            if (error || (result && result.affectedRows === 0)) {
                return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
            }

            db_connection.query("SELECT user_name, user_tag, user_avatar_url, user_id FROM users WHERE user_id IN (?)", [filterOptions.user_id], (error, result2) => {
                if (error || (result2 && result2.affectedRows === 0)) {
                    return response.send({ status: 0, message: CONFIG.messages.SOMETHING_WENT_WRONG });
                }

                let fetchedDataWithAuthor = [];

                result.forEach((record) => {
                    result2.forEach((author) => {
                        if (record.user_id === author.user_id) {
                            record.author = author;
                            fetchedDataWithAuthor.push(record);
                        }
                    });
                });

                return response.send({ status: 1, message: CONFIG.messages.TRACKING_FETCHED, data: fetchedDataWithAuthor });
            });
        });

    });
}