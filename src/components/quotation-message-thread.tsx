"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
// ScrollArea component not available, using div with scroll styling
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Send, 
  User, 
  Shield, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  Unlock,
  X
} from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface QuotationMessageThreadProps {
  quotationId: Id<"quotations">;
  adminId: string;
  adminName: string;
  onClose?: () => void;
}

interface Message {
  _id: Id<"quotationMessages">;
  quotationId: Id<"quotations">;
  authorId: string;
  authorName: string;
  authorRole: "user" | "admin";
  content: string;
  messageType: "message" | "system_notification" | "closure_request" | "closure_permission_granted" | "closure_permission_rejected" | "thread_closed";
  isReadByUser?: boolean;
  isReadByAdmin?: boolean;
  readByUserAt?: number;
  readByAdminAt?: number;
  createdAt: number;
  updatedAt: number;
}

export default function QuotationMessageThread({ 
  quotationId, 
  adminId, 
  adminName, 
  onClose 
}: QuotationMessageThreadProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [closureReason, setClosureReason] = useState("");
  const [showClosureDialog, setShowClosureDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Queries
  const messages = useQuery(api.quotationMessages.getQuotationMessages, {
    quotationId,
  }) as Message[] | undefined;

  const quotation = useQuery(api.quotations.getQuotationById, {
    quotationId,
  });

  const unreadCount = useQuery(api.quotationMessages.getUnreadMessageCount, {
    quotationId,
    readerRole: "admin",
  });

  // Mutations
  const createMessage = useMutation(api.quotationMessages.createQuotationMessage);
  const markAsRead = useMutation(api.quotationMessages.markMessagesAsRead);
  const requestClosure = useMutation(api.quotationMessages.requestThreadClosure);
  const rejectClosure = useMutation(api.quotationMessages.rejectClosureRequest);
  const closeThread = useMutation(api.quotationMessages.closeThread);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Mark messages as read when component mounts or messages change
  useEffect(() => {
    if (messages && unreadCount && unreadCount > 0) {
      markAsRead({
        quotationId,
        readerRole: "admin",
      }).catch(console.error);
    }
  }, [messages, unreadCount, quotationId, markAsRead]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createMessage({
        quotationId,
        authorId: adminId,
        authorName: adminName,
        authorRole: "admin",
        content: newMessage.trim(),
      });

      setNewMessage("");
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestClosure = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await requestClosure({
        quotationId,
        adminId,
        adminName,
        reason: closureReason.trim() || undefined,
      });

      setClosureReason("");
      setShowClosureDialog(false);
      toast.success("Thread closure requested. Waiting for user permission.");
    } catch (error) {
      console.error("Error requesting closure:", error);
      toast.error("Failed to request thread closure");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseThread = async () => {
    if (isSubmitting) return;

    // Extra safety check
    if (quotation?.threadStatus !== "user_approved_closure") {
      toast.error("Cannot close thread. User approval required first.");
      console.error("Attempted to close thread without user approval. Current status:", quotation?.threadStatus);
      return;
    }

    setIsSubmitting(true);
    try {
      await closeThread({
        quotationId,
        adminId,
        adminName,
      });

      toast.success("Thread closed successfully");
      onClose?.();
    } catch (error) {
      console.error("Error closing thread:", error);
      toast.error("Failed to close thread");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMessageTypeIcon = (messageType: string) => {
    switch (messageType) {
      case "system_notification":
        return <AlertCircle className="h-4 w-4" />;
      case "closure_request":
        return <Lock className="h-4 w-4" />;
      case "closure_permission_granted":
        return <Unlock className="h-4 w-4" />;
      case "closure_permission_rejected":
        return <X className="h-4 w-4" />;
      case "thread_closed":
        return <Lock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getThreadStatusBadge = () => {
    if (!quotation) return null;

    switch (quotation.threadStatus) {
      case "active":
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case "awaiting_user_permission":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Awaiting User Permission</Badge>;
      case "user_approved_closure":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">User Approved Closure</Badge>;
      case "closed":
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return null;
    }
  };

  const canSendMessage = quotation?.threadStatus === "active";
  const canRequestClosure = quotation?.threadStatus === "active";
  const canCloseThread = quotation?.threadStatus === "user_approved_closure";

  if (!messages || !quotation) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Loading Messages...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            Message Thread - {quotation.userName}
            {getThreadStatusBadge()}
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Quotation ID: {quotationId} • {messages.length} messages
          </p>
          <p className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
            Thread Status: {quotation?.threadStatus || "undefined"}
          </p>
        </div>
        <div className="flex gap-2">
          {canRequestClosure && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowClosureDialog(true)}
              className="bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100"
            >
              <Lock className="h-4 w-4 mr-2" />
              Request User Permission to Close
            </Button>
          )}
          {canCloseThread && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCloseThread}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              <Lock className="h-4 w-4 mr-2" />
              Close Thread (User Approved)
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="h-96 w-full border rounded-lg p-4 overflow-y-auto">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message._id}
                className={`flex gap-3 ${
                  message.authorRole === "admin" ? "justify-end" : "justify-start"
                }`}
              >
                {message.authorRole === "user" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.authorRole === "admin"
                      ? "bg-blue-600 text-white"
                      : message.messageType === "message"
                      ? "bg-gray-100 text-gray-900"
                      : "bg-yellow-50 text-yellow-800 border border-yellow-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {message.messageType !== "message" && getMessageTypeIcon(message.messageType)}
                    <span className="text-xs font-medium">
                      {message.authorName}
                    </span>
                    <span className="text-xs opacity-70">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  
                  {message.authorRole === "admin" && (
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      {message.isReadByUser ? (
                        <CheckCircle2 className="h-3 w-3 opacity-70" />
                      ) : (
                        <Clock className="h-3 w-3 opacity-70" />
                      )}
                      <span className="text-xs opacity-70">
                        {message.isReadByUser ? "Read" : "Sent"}
                      </span>
                    </div>
                  )}
                </div>

                {message.authorRole === "admin" && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <Shield className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Message Input */}
        {canSendMessage && (
          <>
            <Separator />
            <div className="flex gap-2">
              <Textarea
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="flex-1"
                rows={3}
              />
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isSubmitting}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        )}

        {/* Awaiting User Permission Status */}
        {quotation.threadStatus === "awaiting_user_permission" && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-yellow-600" />
              <h4 className="font-medium text-yellow-800">Waiting for User Permission</h4>
            </div>
            <p className="text-sm text-yellow-700 mb-2">
              You have requested to close this thread. The user will see accept/reject options in their chat interface.
            </p>
            <p className="text-xs text-yellow-600">
              The thread will remain in this state until the user responds to your closure request.
            </p>
          </div>
        )}

        {/* User Approved Closure Status */}
        {quotation.threadStatus === "user_approved_closure" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">User Approved Closure</h4>
            </div>
            <p className="text-sm text-green-700 mb-2">
              The user has approved your request to close this thread. You can now close it using the "Close Thread" button above.
            </p>
          </div>
        )}

        {/* Thread Closed Status */}
        {quotation.threadStatus === "closed" && (
          <div className="text-center py-4 text-muted-foreground">
            <Lock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>This thread has been closed and no new messages can be sent.</p>
          </div>
        )}
      </CardContent>

      {/* Closure Request Dialog */}
      {showClosureDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-yellow-700">
                🔒 Request User Permission to Close Thread
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This will send a request to the user asking for permission to close this message thread. 
                The thread will remain active until the user approves your request.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Textarea
                  placeholder="Provide a reason for closing this thread..."
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowClosureDialog(false);
                    setClosureReason("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRequestClosure}
                  disabled={isSubmitting}
                >
                  Request Closure
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </Card>
  );
}