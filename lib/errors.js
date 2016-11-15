const CreateError = require("create-error");
module.exports = {
  InvalidPlaybookError: CreateError("InvalidPlaybookError", {
    message: "invalid playbook", code: 400}),
  InvalidInventoryError: CreateError("InvalidInventoryError", {
    message: "invalid inventory", code: 400}),
  AnsibleUninstallError: CreateError("AnsibleUninstallError", {
    message: "ansible not found", code: 500}),
  AnsiblePathNotFoundError: CreateError("AnsiblePathNotFoundError", {
    message: "ansible path not found", code: 404}),
  InventoryPathNotFoundError: CreateError("InventoryPathNotFoundError", {
    message: "inventory path not found", code: 404}),
  ExecuteAnsibleError: CreateError("ExecuteAnsibleError", {
    message: "ansible execute error", code: 500}),
  ExecutePlaybookError: CreateError("ExecutePlaybookError", {
    message: "execute playbook error", code: 500}),
  FetchPlaybookError: CreateError("FetchPlaybookError", {
    message: "fetch playbook error", code: 500}),
};
