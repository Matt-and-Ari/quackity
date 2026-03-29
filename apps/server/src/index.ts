import { app } from "./app";
import { serverEnv } from "./env";

app.listen(serverEnv.port);

console.log(`quack server listening on http://localhost:${app.server?.port}`);
