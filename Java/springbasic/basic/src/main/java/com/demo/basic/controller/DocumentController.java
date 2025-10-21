package com.demo.basic.controller;


import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.UUID;

@RestController
public class DocumentController {

    /**
     * A simple DTO (Data Transfer Object) to represent the document reference.
     */
    public static class DocumentReference {
        private String documentId;
       // private String fileName;
      //  private long fileSize;
      //  private String contentType;
        private LocalDateTime uploadTimestamp;

        // Constructors, Getters, and Setters
        public DocumentReference(String documentId, 
        //String fileName, long fileSize, String contentType, 
        LocalDateTime uploadTimestamp) {
            this.documentId = documentId;
         //   this.fileName = fileName;
         //   this.fileSize = fileSize;
         //   this.contentType = contentType;
            this.uploadTimestamp = uploadTimestamp;
        }

        public String getDocumentId() { return documentId; }
        public void setDocumentId(String documentId) { this.documentId = documentId; }
  //      public String getFileName() { return fileName; }
  //      public void setFileName(String fileName) { this.fileName = fileName; }
  //      public long getFileSize() { return fileSize; }
  //      public void setFileSize(long fileSize) { this.fileSize = fileSize; }
  //      public String getContentType() { return contentType; }
  //      public void setContentType(String contentType) { this.contentType = contentType; }
        public LocalDateTime getUploadTimestamp() { return uploadTimestamp; }
        public void setUploadTimestamp(LocalDateTime uploadTimestamp) { this.uploadTimestamp = uploadTimestamp; }
    }

    @PostMapping("/upload")
    public DocumentReference uploadSingleDocument(//@RequestParam("file") MultipartFile file,
                                                  RedirectAttributes redirectAttributes, @RequestParam("subject") String subject,
                                                  @RequestParam(name = "startDate", required = false) String eventDateStartstr,
                                                  @RequestParam(name = "endDate", required = false) String eventDateEndstr,
                                                  @RequestParam("keywords") String[] keywords,
                                                  @RequestParam(name = "location", required = false) String locationStr,
                                                  @RequestParam(name = "documentType", defaultValue = "AUTO") String documentType)
            throws IOException {

        // --- STUBBED RESPONSE ---
        // This is a placeholder implementation.
        // In a real application, you would process the file (e.g., save it to a cloud storage
        // service like S3 or a local disk) and store its metadata in a database.

        // Log the received metadata for demonstration purposes.
       // System.out.println("Received file: " + file.getOriginalFilename());
        System.out.println("Subject: " + subject);
        System.out.println("Keywords: " + Arrays.toString(keywords));
        System.out.println("Document Type: " + documentType);
        System.out.println("Start Date: " + eventDateStartstr);
        System.out.println("End Date: " + eventDateEndstr);
        System.out.println("Location: " + locationStr);


        // Create and return a static DocumentReference object.
        // We use a random UUID to simulate a unique ID generation.
        // We also use some actual data from the uploaded file for realism.
        DocumentReference docRef = new DocumentReference(
                UUID.randomUUID().toString(),
               // file.getOriginalFilename(),
                //file.getSize(),
             //   file.getContentType(),
                LocalDateTime.now()
        );

        // You can use redirectAttributes to pass messages to the redirected view
        // For example: redirectAttributes.addFlashAttribute("message", "File uploaded successfully!");
        
        return docRef;
    }
}