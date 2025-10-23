package com.example.upload.dto;

import java.util.Map;

public class ProcessResult {
    private String filename;
    private Map<String, Object> summerizeResponse; // keep spelling to match endpoint/tests
    private Map<String, Object> keywordsResponse;

    public ProcessResult() {
        // for Jackson
    }

    public ProcessResult(String filename,
                         Map<String, Object> summerizeResponse,
                         Map<String, Object> keywordsResponse) {
        this.filename = filename;
        this.summerizeResponse = summerizeResponse;
        this.keywordsResponse = keywordsResponse;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }

    public Map<String, Object> getSummerizeResponse() {
        return summerizeResponse;
    }

    public void setSummerizeResponse(Map<String, Object> summerizeResponse) {
        this.summerizeResponse = summerizeResponse;
    }

    public Map<String, Object> getKeywordsResponse() {
        return keywordsResponse;
    }

    public void setKeywordsResponse(Map<String, Object> keywordsResponse) {
        this.keywordsResponse = keywordsResponse;
    }
}
