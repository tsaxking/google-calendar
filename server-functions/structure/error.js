"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = void 0;
const files_1 = require("../files");
var ErrorStatus;
(function (ErrorStatus) {
    ErrorStatus[ErrorStatus["CONTINUE"] = 100] = "CONTINUE";
    ErrorStatus[ErrorStatus["SWITCHING_PROTOCOLS"] = 101] = "SWITCHING_PROTOCOLS";
    ErrorStatus[ErrorStatus["PROCESSING"] = 102] = "PROCESSING";
    ErrorStatus[ErrorStatus["EARLY_HINTS"] = 103] = "EARLY_HINTS";
    ErrorStatus[ErrorStatus["OK"] = 200] = "OK";
    ErrorStatus[ErrorStatus["CREATED"] = 201] = "CREATED";
    ErrorStatus[ErrorStatus["ACCEPTED"] = 202] = "ACCEPTED";
    ErrorStatus[ErrorStatus["NON_AUTHORITATIVE_INFORMATION"] = 203] = "NON_AUTHORITATIVE_INFORMATION";
    ErrorStatus[ErrorStatus["NO_CONTENT"] = 204] = "NO_CONTENT";
    ErrorStatus[ErrorStatus["RESET_CONTENT"] = 205] = "RESET_CONTENT";
    ErrorStatus[ErrorStatus["PARTIAL_CONTENT"] = 206] = "PARTIAL_CONTENT";
    ErrorStatus[ErrorStatus["MULTI_STATUS"] = 207] = "MULTI_STATUS";
    ErrorStatus[ErrorStatus["ALREADY_REPORTED"] = 208] = "ALREADY_REPORTED";
    ErrorStatus[ErrorStatus["IM_USED"] = 226] = "IM_USED";
    ErrorStatus[ErrorStatus["MULTIPLE_CHOICES"] = 300] = "MULTIPLE_CHOICES";
    ErrorStatus[ErrorStatus["MOVED_PERMANENTLY"] = 301] = "MOVED_PERMANENTLY";
    ErrorStatus[ErrorStatus["FOUND"] = 302] = "FOUND";
    ErrorStatus[ErrorStatus["SEE_OTHER"] = 303] = "SEE_OTHER";
    ErrorStatus[ErrorStatus["NOT_MODIFIED"] = 304] = "NOT_MODIFIED";
    ErrorStatus[ErrorStatus["USE_PROXY"] = 305] = "USE_PROXY";
    ErrorStatus[ErrorStatus["UNUSED"] = 306] = "UNUSED";
    ErrorStatus[ErrorStatus["TEMPORARY_REDIRECT"] = 307] = "TEMPORARY_REDIRECT";
    ErrorStatus[ErrorStatus["PERMANENT_REDIRECT"] = 308] = "PERMANENT_REDIRECT";
    ErrorStatus[ErrorStatus["BAD_REQUEST"] = 400] = "BAD_REQUEST";
    ErrorStatus[ErrorStatus["UNAUTHORIZED"] = 401] = "UNAUTHORIZED";
    ErrorStatus[ErrorStatus["PAYMENT_REQUIRED"] = 402] = "PAYMENT_REQUIRED";
    ErrorStatus[ErrorStatus["FORBIDDEN"] = 403] = "FORBIDDEN";
    ErrorStatus[ErrorStatus["NOT_FOUND"] = 404] = "NOT_FOUND";
    ErrorStatus[ErrorStatus["METHOD_NOT_ALLOWED"] = 405] = "METHOD_NOT_ALLOWED";
    ErrorStatus[ErrorStatus["NOT_ACCEPTABLE"] = 406] = "NOT_ACCEPTABLE";
    ErrorStatus[ErrorStatus["PROXY_AUTHENTICATION_REQUIRED"] = 407] = "PROXY_AUTHENTICATION_REQUIRED";
    ErrorStatus[ErrorStatus["REQUEST_TIMEOUT"] = 408] = "REQUEST_TIMEOUT";
    ErrorStatus[ErrorStatus["CONFLICT"] = 409] = "CONFLICT";
    ErrorStatus[ErrorStatus["GONE"] = 410] = "GONE";
    ErrorStatus[ErrorStatus["LENGTH_REQUIRED"] = 411] = "LENGTH_REQUIRED";
    ErrorStatus[ErrorStatus["PRECONDITION_FAILED"] = 412] = "PRECONDITION_FAILED";
    ErrorStatus[ErrorStatus["PAYLOAD_TOO_LARGE"] = 413] = "PAYLOAD_TOO_LARGE";
    ErrorStatus[ErrorStatus["URI_TOO_LONG"] = 414] = "URI_TOO_LONG";
    ErrorStatus[ErrorStatus["UNSUPPORTED_MEDIA_TYPE"] = 415] = "UNSUPPORTED_MEDIA_TYPE";
    ErrorStatus[ErrorStatus["RANGE_NOT_SATISFIABLE"] = 416] = "RANGE_NOT_SATISFIABLE";
    ErrorStatus[ErrorStatus["EXPECTATION_FAILED"] = 417] = "EXPECTATION_FAILED";
    ErrorStatus[ErrorStatus["IM_A_TEAPOT"] = 418] = "IM_A_TEAPOT";
    ErrorStatus[ErrorStatus["MISDIRECTED_REQUEST"] = 421] = "MISDIRECTED_REQUEST";
    ErrorStatus[ErrorStatus["UNPROCESSABLE_CONTENT"] = 422] = "UNPROCESSABLE_CONTENT";
    ErrorStatus[ErrorStatus["LOCKED"] = 423] = "LOCKED";
    ErrorStatus[ErrorStatus["FAILED_DEPENDENCY"] = 424] = "FAILED_DEPENDENCY";
    ErrorStatus[ErrorStatus["TOO_EARLY"] = 425] = "TOO_EARLY";
    ErrorStatus[ErrorStatus["UPGRADE_REQUIRED"] = 426] = "UPGRADE_REQUIRED";
    ErrorStatus[ErrorStatus["PRECONDITION_REQUIRED"] = 428] = "PRECONDITION_REQUIRED";
    ErrorStatus[ErrorStatus["TOO_MANY_REQUESTS"] = 429] = "TOO_MANY_REQUESTS";
    ErrorStatus[ErrorStatus["REQUEST_HEADER_FIELDS_TOO_LARGE"] = 431] = "REQUEST_HEADER_FIELDS_TOO_LARGE";
    ErrorStatus[ErrorStatus["UNAVAILABLE_FOR_LEGAL_REASONS"] = 451] = "UNAVAILABLE_FOR_LEGAL_REASONS";
    ErrorStatus[ErrorStatus["INTERNAL_SERVER_ERROR"] = 500] = "INTERNAL_SERVER_ERROR";
    ErrorStatus[ErrorStatus["NOT_IMPLEMENTED"] = 501] = "NOT_IMPLEMENTED";
    ErrorStatus[ErrorStatus["BAD_GATEWAY"] = 502] = "BAD_GATEWAY";
    ErrorStatus[ErrorStatus["SERVICE_UNAVAILABLE"] = 503] = "SERVICE_UNAVAILABLE";
    ErrorStatus[ErrorStatus["GATEWAY_TIMEOUT"] = 504] = "GATEWAY_TIMEOUT";
    ErrorStatus[ErrorStatus["HTTP_VERSION_NOT_SUPPORTED"] = 505] = "HTTP_VERSION_NOT_SUPPORTED";
    ErrorStatus[ErrorStatus["VARIANT_ALSO_NEGOTIATES"] = 506] = "VARIANT_ALSO_NEGOTIATES";
    ErrorStatus[ErrorStatus["INSUFFICIENT_STORAGE"] = 507] = "INSUFFICIENT_STORAGE";
    ErrorStatus[ErrorStatus["LOOP_DETECTED"] = 508] = "LOOP_DETECTED";
    ErrorStatus[ErrorStatus["NOT_EXTENDED"] = 510] = "NOT_EXTENDED";
    ErrorStatus[ErrorStatus["NETWORK_AUTHENTICATION_REQUIRED"] = 511] = "NETWORK_AUTHENTICATION_REQUIRED";
})(ErrorStatus || (ErrorStatus = {}));
class ServerError {
    status;
    message;
    description;
    constructor({ status, message, description }) {
        this.status = status;
        this.message = message;
        this.description = description;
        (0, files_1.log)(files_1.LogType.ERROR, this.json);
    }
    get json() {
        return {
            status: this.status,
            message: this.message,
            description: this.description
        };
    }
    get html() {
        return (0, files_1.getTemplateSync)('error', this.json);
    }
}
exports.ServerError = ServerError;
