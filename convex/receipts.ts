"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const processReceiptImage = action({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    // Get the file from storage
    const file = await ctx.storage.get(args.storageId);
    if (!file) {
      throw new Error("File not found");
    }

    // Convert file to base64 for AI processing
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || "image/jpeg";
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract the following information in JSON format:
                {
                  "amount": number (total amount),
                  "description": string (brief description of items/service),
                  "category": string (one of: "Office Supplies", "Travel", "Meals & Entertainment", "Software & Subscriptions", "Equipment", "Marketing", "Training", "Other"),
                  "date": string (date in YYYY-MM-DD format),
                  "merchant": string (store/vendor name)
                }
                
                If any information is unclear or missing, make reasonable assumptions. For category, choose the most appropriate one from the list provided.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      // Parse the JSON response
      const extractedData = JSON.parse(content);
      return extractedData;

    } catch (error) {
      console.error("OpenAI processing failed:", error);
      
      // Fallback to mock data if AI fails
      return {
        amount: 0,
        description: "Receipt processing failed - please enter manually",
        category: "Other",
        date: new Date().toISOString().split('T')[0],
        merchant: "Unknown"
      };
    }
  },
});

export const uploadAndProcessReceipt = action({
  args: {
    file: v.any(), // File data
  },
  handler: async (ctx, args) => {
    // Store the file in Convex storage
    const storageId = await ctx.storage.store(args.file);
    
    // Get the file from storage
    const file = await ctx.storage.get(storageId);
    if (!file) {
      throw new Error("File not found");
    }

    // Convert file to base64 for AI processing
    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = file.type || "image/jpeg";
    
    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analyze this receipt image and extract the following information in JSON format:
                {
                  "amount": number (total amount),
                  "description": string (brief description of items/service),
                  "category": string (one of: "Office Supplies", "Travel", "Meals & Entertainment", "Software & Subscriptions", "Equipment", "Marketing", "Training", "Other"),
                  "date": string (date in YYYY-MM-DD format),
                  "merchant": string (store/vendor name)
                }
                
                If any information is unclear or missing, make reasonable assumptions. For category, choose the most appropriate one from the list provided.`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${base64}`
                }
              }
            ]
          }
        ],
        max_tokens: 500,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from OpenAI");
      }

      // Parse the JSON response
      const extractedData = JSON.parse(content);
      return extractedData;

    } catch (error) {
      console.error("OpenAI processing failed:", error);
      
      // Fallback to mock data if AI fails
      return {
        amount: 0,
        description: "Receipt processing failed - please enter manually",
        category: "Other",
        date: new Date().toISOString().split('T')[0],
        merchant: "Unknown"
      };
    }
  },
});