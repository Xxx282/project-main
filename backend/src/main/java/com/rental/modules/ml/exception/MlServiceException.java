/*
 * @Author: Mendax
 * @Date: 2026-02-03 19:34:08
 * @LastEditors: Mendax
 * @LastEditTime: 2026-02-03 20:11:36
 * @Description: 
 * @FilePath: \project\backend\src\main\java\com\rental\modules\ml\exception\MlServiceException.java
 */
package com.rental.modules.ml.exception;

import com.rental.common.ResultCode;

/**
 * ML 服务异常
 */
public class MlServiceException extends RuntimeException {

    private final Integer code;

    public MlServiceException(String message) {
        super(message);
        this.code = ResultCode.ML_SERVICE_UNAVAILABLE.getCode();
    }

    public MlServiceException(Integer code, String message) {
        super(message);
        this.code = code;
    }

    public MlServiceException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.code = resultCode.getCode();
    }

    public Integer getCode() {
        return code;
    }
}
