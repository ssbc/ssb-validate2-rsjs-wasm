import {
  ready,
  verifySignatures,
  validateSingle,
  validateBatch,
  validateOOOBatch,
  validateMultiAuthorBatch,
} from "./api.js";
import * as Comlink from "comlink";

Comlink.expose({
  ready,
  verifySignatures,
  validateSingle,
  validateBatch,
  validateOOOBatch,
  validateMultiAuthorBatch,
});
