import {app} from "./app";
import {sequelizeConnection} from "./models/connection";

const PORT = process.env.PORT || 3000;


sequelizeConnection.sync().then(() => {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
});
