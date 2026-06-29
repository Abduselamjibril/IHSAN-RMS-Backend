import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'reports',
})
export class ReportsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected to real-time reports engine: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected from real-time reports engine: ${client.id}`);
  }

  // Broadcaster for realtime activity updates
  broadcastUpdate(event: string, payload: any) {
    if (this.server) {
      this.server.emit(event, payload);
    }
  }
}
