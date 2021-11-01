import PVObject from "PersistentData"
const NBTTagList = Java.type("com.chattriggers.ctjs.minecraft.wrappers.objects.inventory.nbt.NBTTagList")
const NBTTagString = Java.type("net.minecraft.nbt.NBTTagString")
const items = new PVObject("PricePaid", {})

let lastViewedItem = null
register("tick", () => {
    const inv = Player.getOpenedInventory()
    if (Player.getOpenedInventory().getName() !== "BIN Auction View") return
    lastViewedItem = inv.getStackInSlot(13)
})

register("chat", (item, amount) => {
    if (lastViewedItem === null) return
    if (ChatLib.removeFormatting(lastViewedItem.getName()) !== item) return
    const uuid = lastViewedItem.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getTag("uuid")
    if (uuid === null) return
    items[uuid] = {name: lastViewedItem.getName(), paid: amount, time: Date.now()}
}).setCriteria("You purchased ${item} for ${amount} coins!")

register("itemTooltip", (lore, item) => {
    const uuid = item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getTag("uuid")
    if (uuid === null || items[uuid] === undefined) return
    const paidText = `§r§7Price Paid: §c$${items[uuid].paid}`
    const list = new NBTTagList(item.getNBT().getCompoundTag("tag").getCompoundTag("display").getTagMap().get("Lore"))
    let modified = false
    for (let i = 0; i < list.getTagCount(); i++) {
        if (list.getStringTagAt(i) !== paidText) continue
        modified = true
    }
    if (modified) return
    list.appendTag(new NBTTagString(paidText))
})

register("command", command).setName("paid")
register("command", command).setName("pricepaid")

function command(amount, confirmedAmount) {
    if (!amount) {
        ChatLib.chat("&c&m" + ChatLib.getChatBreak())
        ChatLib.chat("&c&o/pricepaid [number]")
        ChatLib.chat("&c&0/price [number]")
        ChatLib.chat("")
        ChatLib.chat("&cManually enter a price for the currently held item.")
        ChatLib.chat("&cItems with prices will ask to confirm before changing the price.")
        ChatLib.chat("&c&lThere is no way to undo this!")
        ChatLib.chat("&c&m" + ChatLib.getChatBreak())
    } else {
        if (amount == "confirm") {
            print("test")
            const uuid = lastViewedItem.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getTag("uuid")
            if (uuid === null) {
                ChatLib.clearChat(1839833700)
                new Message("&c[PricePaid] Could not fine UUID for item! Try again").setChatLineId(1839833701).chat()
            } else {
                items[uuid] = {name: lastViewedItem.getName(), paid: confirmedAmount, time: Date.now()}
                new Message("&a[PricePaid] Manually set price for " + lastViewedItem.getName() + " &ato $" + confirmedAmount).setChatLineId(1839833700).chat()
                new Message("&aYou might see two prices until the old one clears itself.").setChatLineId(1839833701).chat()
            }
        } else if (amount == "deny") {
            ChatLib.clearChat(1839833700)
            new Message("&c[PricePaid] Cancelled changing price").setChatLineId(1839833701).chat()
        } else {
            const item = Player.getHeldItem()
            const uuid = item.getNBT().getCompoundTag("tag").getCompoundTag("ExtraAttributes").getTag("uuid")
            if (uuid === null) {
                ChatLib.chat("&cThis item is not unique! It can not store its price")
            } else {
                if (!items[uuid]) {
                    items[uuid] = {name: item.getName(), paid: amount, time: Date.now()}
                    ChatLib.chat("&a[PricePaid] Manually set the price for " + item.getName() + " &ato $" + amount)
                } else {
                    lastViewedItem = item
                    new Message("&cYou are about to change the price of " + item.getName() + " &cto $" + amount).setChatLineId(1839833700).chat()
                    new Message(
                        "&cConfirm? ",
                        new TextComponent("&a[Yes]").setClick("run_command", "/pricepaid confirm " + amount).setHoverValue("&aChange Price"),
                        " ",
                        new TextComponent("&4[No]").setClick("run_command", "/pricepaid deny").setHoverValue("&cCancel")
                    ).setChatLineId(1839833701).chat()
                }
            }
        }
    }
}