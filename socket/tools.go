package socket

type SocketInfo struct {
	Connections []string `json:"connections"`
}

func GetSocketInfo(h *Hub) (si SocketInfo, e error) {
	for k, v := range h.clients {
		if v {
			si.Connections = append(si.Connections, k.conn.LocalAddr().String())
		}
	}

	return
}
