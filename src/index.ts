import express from "express";
import { AssistantController } from "./controllers/assistantController";
import { OpenAIAssistantService } from "./services/assistantService";
import { OpenAIModerationService } from "../moderationService";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();
const app = express();

app.use(express.json());
app.use(cors());

const assistantService = new OpenAIAssistantService();
const moderationService = new OpenAIModerationService();
const assistantController = new AssistantController(
  assistantService,
  moderationService
);
const port = process.env.PORT;

app.post("/generateToken", (req, res) =>
  assistantController.generateToken(req, res)
);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
