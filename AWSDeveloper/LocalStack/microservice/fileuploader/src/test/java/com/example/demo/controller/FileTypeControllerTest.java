package com.example.demo.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(FileTypeController.class)
class FileTypeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void testDetectPdfFileType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                "test content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/files/detect-type")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(content().string("File type: PDF Document"));
    }

    @Test
    void testDetectJpegFileType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "image.jpg",
                MediaType.IMAGE_JPEG_VALUE,
                "test content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/files/detect-type")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(content().string("File type: JPEG Image"));
    }

    @Test
    void testDetectPngFileType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "image.png",
                MediaType.IMAGE_PNG_VALUE,
                "test content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/files/detect-type")
                        .file(file))
                .andExpect(status().isOk())
                .andExpect(content().string("File type: PNG Image"));
    }

    @Test
    void testDetectUnsupportedFileType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "document.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "test content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/files/detect-type")
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Unsupported file type"));
    }

    @Test
    void testEmptyFile() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "empty.pdf",
                MediaType.APPLICATION_PDF_VALUE,
                new byte[0]
        );

        mockMvc.perform(multipart("/api/v1/files/detect-type")
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("File is empty"));
    }

    @Test
    void testInvalidFileName() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "noextension",
                MediaType.APPLICATION_OCTET_STREAM_VALUE,
                "test content".getBytes()
        );

        mockMvc.perform(multipart("/api/v1/files/detect-type")
                        .file(file))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Invalid file name"));
    }
}