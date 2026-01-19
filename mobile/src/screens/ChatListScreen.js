import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { jwtDecode } from "jwt-decode";

import { api, clearAccessToken, getAccessToken } from "../lib/api";
import { decryptText } from "../utils/crypto";   // ✅ decrypt preview

export default function ChatListScreen({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [myUserId, setMyUserId] = useState(null);

  /* ===========================
     Safe Decrypt Preview
  ============================ */
  const decryptPreview = (encrypted) => {
    try {
      return decryptText(encrypted);
    } catch (err) {
      console.log("⚠️ Preview decrypt failed");
      return "🔒 Encrypted message";
    }
  };

  /* ===========================
     Load Users + Decode Token
  ============================ */
  const loadUsers = async () => {
    try {
      const token = getAccessToken();
      console.log("🔐 Token:", token);

      // 🚪 No token → go to login
      if (!token) {
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
        return;
      }

      // ✅ Decode JWT safely
      let decoded;
      try {
        decoded = jwtDecode(token);
      } catch (err) {
        console.log("❌ Token decode failed:", err.message);
        handleForceLogout();
        return;
      }

      const userId = decoded?.userId || decoded?.id;
      if (!userId) {
        console.log("❌ userId missing in token");
        handleForceLogout();
        return;
      }

      console.log("👤 Logged-in userId:", userId);
      setMyUserId(userId);

      console.log("📡 Loading users...");
      const res = await api.get("/users");
      setUsers(res.data || []);
    } catch (err) {
      console.log("❌ LOAD USERS ERROR:", err?.message);

      if (err?.response?.status === 401) {
        handleForceLogout();
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  /* ===========================
     Reload on Screen Focus
  ============================ */
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadUsers();
    }, [])
  );

  /* ===========================
     Pull to Refresh
  ============================ */
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, []);

  /* ===========================
     Force Logout
  ============================ */
  const handleForceLogout = () => {
    console.log("🚪 Force logout");

    clearAccessToken();
    setUsers([]);
    setMyUserId(null);

    navigation.reset({
      index: 0,
      routes: [{ name: "Login" }],
    });
  };

  /* ===========================
     Manual Logout
  ============================ */
  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: handleForceLogout,
      },
    ]);
  };

  /* ===========================
     Search Filter
  ============================ */
  const filteredUsers = users.filter((u) =>
    u.username?.toLowerCase().includes(search.toLowerCase())
  );

  /* ===========================
     Open Chat
  ============================ */
  const openChat = (item) => {
    if (!myUserId) {
      Alert.alert("Please wait", "User session not ready yet.");
      return;
    }

    navigation.navigate("Chat", {
      user: {
        ...item,
        myId: myUserId, // ✅ pass logged-in user id
      },
    });
  };

  /* ===========================
     Loading UI
  ============================ */
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22d3ee" />
        <Text style={styles.loadingText}>Loading users...</Text>
      </View>
    );
  }

  /* ===========================
     Render User Row
  ============================ */
  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.chatRow}
      activeOpacity={0.7}
      onPress={() => openChat(item)}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.username?.charAt(0)?.toUpperCase()}
        </Text>
      </View>

      <View style={styles.chatContent}>
        <Text style={styles.chatName}>{item.username}</Text>

        {/* ✅ Last message preview */}
        <Text style={styles.chatMsg} numberOfLines={1}>
          {item.lastMessage?.encryptedText
            ? decryptPreview(item.lastMessage.encryptedText)
            : "No messages yet"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  /* ===========================
     UI
  ============================ */
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Chats</Text>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <TextInput
          placeholder="Search users..."
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* User List */}
      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item._id}
        renderItem={renderUser}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <Text style={styles.empty}>No users found</Text>
        }
      />
    </View>
  );
}

/* =======================
   Styles
======================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000", paddingTop: 50 },

  center: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: { marginTop: 10, color: "#aaa" },

  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 12,
  },

  title: { fontSize: 32, fontWeight: "bold", color: "#fff" },

  logoutBtn: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#ec4899",
  },

  logoutText: { color: "#22d3ee", fontWeight: "700" },

  searchBox: {
    marginHorizontal: 14,
    marginBottom: 10,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 12,
  },

  searchInput: { color: "#fff", height: 42 },

  chatRow: {
    flexDirection: "row",
    padding: 14,
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: "#222",
  },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#22d3ee",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: { color: "#000", fontWeight: "bold", fontSize: 18 },

  chatContent: { flex: 1 },

  chatName: { color: "#fff", fontSize: 15, fontWeight: "600" },

  chatMsg: { color: "#aaa", fontSize: 12, marginTop: 2 },

  empty: { color: "#777", textAlign: "center", marginTop: 40 },
});
