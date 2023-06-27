import { Component } from "inferno";
import { Avatar, IconListItem } from "KaiUI";
import { Room, RoomEvent, User, UserEvent, MatrixEvent } from "matrix-js-sdk";
import personIcon from "./person_icon.png";
import { makeHumanReadableEvent, getAvatarOrDefault } from "./utils";
import { shared } from "./shared";


interface ChatDMItemState {
  displayName: string;
  avatarUrl?: string;
  presence: string;
  lastEvent: string;
  lastActiveAgo: number;
}

interface ChatDMItemProps {
  room: Room;
}

export default class ChatDMItem extends Component<ChatDMItemProps, ChatDMItemState> {
  updateDisplayName = (_evt: MatrixEvent | undefined, user: User) => {
    this.setState((state: ChatDMItemState) => {
      state.displayName = user.displayName || state.displayName;
      return state;
    });
  };

  updateAvatar = (_evt: MatrixEvent | undefined, user: User) => {
    this.setState((state: ChatDMItemState) => {
      state.avatarUrl = user.avatarUrl || state.avatarUrl;
      return state;
    });
  };

  updatePresence = (_evt: MatrixEvent | undefined, user: User) => {
    this.setState((state: ChatDMItemState) => {
      state.presence = user.presence || state.presence;
      return state;
    });
  };

  updateTimeline = (_evt: MatrixEvent, room: Room | undefined) => { 
    if (!room) return;
    let lastEvent: MatrixEvent | undefined = room.getLastLiveEvent();
    if (!lastEvent) return;
    this.setState({
      lastEvent: makeHumanReadableEvent(lastEvent, true)
    });
  }

  constructor(props: ChatDMItemProps) {
    super(props);
    if (!shared.mClient) {
      throw new Error("mClient is null");
    }
    let user: User | null = shared.mClient.getUser(props.room.guessDMUserId());
    if (!user) {
      throw Error("User not found");
    }
    let lastEvent: MatrixEvent | undefined = props.room.getLastLiveEvent();
    this.state = {
      presence: user.presence,
      lastActiveAgo: user.lastActiveAgo,
      avatarUrl: user.avatarUrl,
      displayName: user.displayName || user.userId,
      lastEvent: (lastEvent && makeHumanReadableEvent(lastEvent, true)) || "",
    };
  }

  componentDidMount() {
    if (!shared.mClient) {
      throw new Error("mClient is null");
    }
    let user: User | null = shared.mClient.getUser(this.props.room.guessDMUserId());
    if (!user) {
      return;
    }
    user.on(UserEvent.Presence, this.updatePresence);
    user.on(UserEvent.AvatarUrl, this.updateAvatar);
    user.on(UserEvent.DisplayName, this.updateDisplayName);
    this.props.room.on(RoomEvent.Timeline, this.updateTimeline);
  }

  componentWillUnmount() {
    let user: User | null = shared.mClient.getUser(this.props.room.guessDMUserId());
    if (!user) {
      return;
    }
    user.off(UserEvent.Presence, this.updatePresence);
    user.off(UserEvent.AvatarUrl, this.updateAvatar);
    user.off(UserEvent.DisplayName, this.updateDisplayName);
    this.props.room.off(RoomEvent.Timeline, this.updateTimeline);
  }

  render() {
    const { presence, displayName, avatarUrl } = this.state;
    let avatar = getAvatarOrDefault(avatarUrl, personIcon);
    let lastEvent = this.state.lastEvent;
    if (lastEvent.length >= 33) lastEvent = lastEvent.slice(0, 33) + "...";

    return (
      <IconListItem
        icon={<Avatar avatar={avatar} online={presence} />}
        secondary={displayName}
        primary={lastEvent}
      />
    );
  }
}
