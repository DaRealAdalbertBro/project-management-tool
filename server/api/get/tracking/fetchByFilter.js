module.exports = function (app, db_connection) {
    const CONFIG = require("../../../config.json");
    const validateInput = require('../../../utils/validateInput')();
    const validator = require("validator").default;

    app.get("/api/get/tracking/fetchByFilter", (request, response) => {
        // check if user has permissions to update users
        if (!request.session.user) {
            return response.send({ status: 0, message: CONFIG.messages.NOT_LOGGED_IN });
        }

        let user_id = request.query.user_id;
        let recordsToSelect = validator.escape(request.query.recordsToSelect) || 30;
        let tags = request.query.tags;
        let daysInterval = request.query.daysInterval;

        if (recordsToSelect < 0 || recordsToSelect > 365) {
            recordsToSelect = 30;
        }

        console.log(daysInterval)

        const filterOptions = {};

        if (user_id && user_id.length > 0) {
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

        // try parsing daysInterval array that has 2 dates and check these dates
        // if dates are not valid, set daysInterval to this week
        // if dates are valid, store them to filterOptions.daysInterval array
        if (daysInterval) {
            if (!Array.isArray(daysInterval)) {
                daysInterval = daysInterval.split(",");
            }

            if (daysInterval.length === 2) {
                // try parsing dates
                try {
                    daysInterval[0] = new Date(daysInterval[0]);
                    daysInterval[1] = new Date(daysInterval[1]);

                    filterOptions.daysInterval = daysInterval;
                } catch (error) {
                    const date = new Date();
                    const day = date.getDay();
                    const diff = date.getDate() - day + (day === 0 ? -6 : 1);

                    filterOptions.daysInterval = [new Date(date.setDate(diff)), new Date()];
                }

            }

        }

        if (!filterOptions.daysInterval
            || filterOptions.daysInterval.length !== 2
            || filterOptions.daysInterval[0] > filterOptions.daysInterval[1]
            || filterOptions.daysInterval[0] > new Date()
            || filterOptions.daysInterval[1] > new Date()) {
            console.log("RESET INTERVAL")
            const date = new Date();
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1);

            filterOptions.daysInterval = [new Date(date.setDate(diff)), new Date()];
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

        // let query = `SELECT * FROM tracking WHERE user_id IN (?) AND start_date BETWEEN ? AND ? - INTERVAL ? DAY ORDER BY start_date DESC LIMIT ?`;
        // let values = [filterOptions.user_id, filterOptions.daysInterval[0], filterOptions.daysInterval[1], filterOptions.recordsToSelect];

        // if (filterOptions.tags) {
        //     const tagsQuery = filterOptions.tags.map((tag) => {
        //         return `tags LIKE '%${tag}%'`;
        //     }
        //     ).join(" OR ");

        //     query = `SELECT * FROM tracking WHERE user_id IN (?) AND start_date BETWEEN ? AND ? - INTERVAL ? DAY AND (${tagsQuery}) ORDER BY start_date DESC LIMIT ?`;
        //     values = [filterOptions.user_id, filterOptions.daysInterval[0], filterOptions.daysInterval[1], filterOptions.recordsToSelect];
        // }

        // if (filterOptions.daysInterval) {
        //     query = `SELECT * FROM tracking WHERE user_id IN (?) AND start_date BETWEEN ? AND ? ORDER BY start_date DESC LIMIT ?`;
        //     values = [filterOptions.user_id, filterOptions.daysInterval[0], filterOptions.daysInterval[1], filterOptions.recordsToSelect];
        // }

        let tagFilterQuery = "";
        let tagFilterValues = [];

        // if (filterOptions.tags) {
        //     // check for each tag if it is in tags column
        //     // if it is, add it to tagFilterValues array
        //     // if it is not, remove it from tags array
        //     // look out for words like "javascript" and "javascripts"
        //     // if tag is found, add it to tagFilterValues array
        //     // if tag is not found, remove it from tags array
        //     filterOptions.tags.forEach((tag, index) => {
        //         if (tag === "") {
        //             filterOptions.tags.splice(index, 1);
        //             return;
        //         }

        //         tagFilterQuery += `tags LIKE ? OR `;
        //         tagFilterValues.push(`%${tag}%`);
        //     })

        //     // remove last " OR " from tagFilterQuery
        //     tagFilterQuery = tagFilterQuery.slice(0, -4);

        //     // if there are no tags left, remove tagFilterQuery and tagFilterValues
        //     if (filterOptions.tags.length === 0) {
        //         tagFilterQuery = "";
        //         tagFilterValues = [];
        //     }

        //     // if there are tags left, add "AND" to tagFilterQuery
        //     if (filterOptions.tags.length > 0) {
        //         tagFilterQuery = `AND (${tagFilterQuery})`;
        //     }
            
        // }

        if (filterOptions.tags) {
            tagFilterQuery = `AND tags REGEXP`;
            filterOptions.tags.forEach((tag, index) => {
                if (tag === "") {
                    filterOptions.tags.splice(index, 1);
                    return;
                }

                tagFilterQuery += ` \\${tag}\\b OR`;
                
            })

            // remove last " OR " from tagFilterQuery
            tagFilterQuery = tagFilterQuery.slice(0, -3);

            // if there are no tags left, remove tagFilterQuery and tagFilterValues
            if (filterOptions.tags.length === 0) {
                tagFilterQuery = "";
                tagFilterValues = [];
            }

            // if there are tags left, add "AND" to tagFilterQuery
            if (filterOptions.tags.length > 0) {
                tagFilterQuery = `AND (${tagFilterQuery})`;
            }
            
        }
        console.log(tagFilterQuery)

        let dayFilterQuery = "";
        let dayFilterValues = [];

        if (filterOptions.daysInterval) {
            dayFilterQuery = `AND start_date BETWEEN ? AND ?`;
            dayFilterValues = [filterOptions.daysInterval[0], filterOptions.daysInterval[1]];
        }

        let query = `SELECT * FROM tracking WHERE user_id IN (?) ${tagFilterQuery} ${dayFilterQuery} ORDER BY start_date DESC LIMIT ?`;
        let values = [filterOptions.user_id, ...tagFilterValues, ...dayFilterValues, filterOptions.recordsToSelect];

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