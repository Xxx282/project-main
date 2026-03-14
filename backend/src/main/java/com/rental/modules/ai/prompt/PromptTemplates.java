package com.rental.modules.ai.prompt;

import com.rental.modules.property.entity.Property;

import java.util.List;

/**
 * AI Prompt 模板
 */
public class PromptTemplates {

    /**
     * 城市列表（用于 AI 知道可以搜索哪些城市）
     */
    private static final String CITIES = "Kolkata, Mumbai, Bangalore, Delhi, Chennai, Hyderabad";

    /**
     * 构建解析 Prompt
     * 将自然语言解析为结构化搜索条件
     */
    public static String buildParsePrompt(String userQuery) {
        return """
            你是一个房屋租赁搜索助手。请将用户的自然语言查询解析为结构化搜索条件。

            可用城市: %s

            用户查询: %s

            请按以下 JSON 格式返回（只返回 JSON，不要其他内容）：
            {
                "city": "城市名，如果无法确定则为 null",
                "region": "区域名，如果无法确定则为 null",
                "bedrooms": 卧室数（数字），如果无法确定则为 null,
                "bathrooms": 卫生间数（数字），如果无法确定则为 null,
                "minPrice": 最低价格（数字），如果未提及则为 null,
                "maxPrice": 最高价格（数字），如果未提及则为 null,
                "nearSubway": 是否近地铁（true/false），如果未提及则为 null
            }

            注意：
            - 价格单位默认是元/月
            - "2000以内" 表示 maxPrice=2000
            - "一室" 或 "1室" 表示 bedrooms=1
            - "一室一厅" 只需要解析卧室数 bedrooms=1
            """.formatted(CITIES, userQuery);
    }

    /**
     * 构建回答 Prompt
     * 根据搜索结果生成 AI 总结回答
     */
    public static String buildAnswerPrompt(String userQuery, List<Property> properties) {
        return """
            你是一个房屋租赁顾问。请根据用户的查询条件和搜索结果，给出友好的回答。

            用户查询: %s

            搜索结果: %s

            请用友好的语气总结搜索结果，包括：
            1. 一共找到多少套符合条件的房源
            2. 价格范围是多少
            3. 推荐几套性价比高的房源
            4. 给出一些租房建议

            如果没有找到房源，请友好地说明，并建议用户放宽条件。
            """.formatted(userQuery, properties.toString());
    }

    /**
     * 构建问答 Prompt
     */
    public static String buildChatPrompt(String question) {
        return """
            你是一个房屋租赁顾问。请回答用户关于租房的问题。

            用户问题: %s

            请给出专业、友好的回答。
            """.formatted(question);
    }

    /**
     * 构建「租客咨询房东」场景下的 AI 回复建议 Prompt
     * @param listingTitle 房源标题
     * @param listingPrice 租金
     * @param listingDescription 房源描述（可选，提供更多上下文）
     * @param recentMessages 最近几条对话（格式：角色: 内容）
     */
    public static String buildConsultationReplyPrompt(String listingTitle, String listingPrice, String listingDescription, String recentMessages) {
        String descInfo = (listingDescription != null && !listingDescription.isEmpty())
            ? "房源详细描述：" + listingDescription + "\n\n"
            : "";
        return """
            你是租房咨询助手。当前是租客正在和房东咨询一套房源，请根据对话记录和房源信息为租客生成一条简短、得体的回复建议（1～3句话即可），方便租客直接发送或稍作修改后发送。

            房源信息：%s，租金 %s/月
            %s
            最近对话：
            %s

            要求：
            - 语气礼貌、自然、专业
            - 如果房东在描述中提到了房源的特点（如位置、交通、配套、装修等），可以针对这些点进行询问或回应
            - 可以是继续询问（如看房时间、付款方式、是否包物业）、表达意向或简单回应
            - 只输出建议的回复内容，不要加引号或说明，不要用"以下是建议回复："这样的前缀
            """.formatted(
                listingTitle != null ? listingTitle : "未知房源",
                listingPrice != null ? listingPrice : "面议",
                descInfo,
                recentMessages != null && !recentMessages.isEmpty() ? recentMessages : "（暂无对话）"
            );
    }
}
