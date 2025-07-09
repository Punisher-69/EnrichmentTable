import React from "react";
import { Tooltip } from "@heroui/react";

interface Enrichment {
  title: string;
  description: string;
  icon: React.ReactNode;
  enrichmentName: string;
  aiModel: string;
  objective: string;
  isEdit?: boolean;
  index?: number;
  number?: number;
  createdAt?: number;
}

const EnrichmentTable = React.memo(
  ({ enrichments }: { enrichments: Enrichment[] }) => {
    return (
      <div className="mt-4  ">
        <table className="border    ">
          <tbody>
            <tr>
              <th className=" border w-10 ">
                <input className="size-4" type="checkbox" />
              </th>
              <th className="border w-[20vw] text-left pl-2 ">Company Name</th>

              {enrichments.map((item, idx) => (
                <th className="border w-2  " key={idx}>
                  <Tooltip closeDelay={0} color="primary" content={item.title}>
                    <div className="flex justify-center">{item.icon}</div>
                  </Tooltip>
                </th>
              ))}
              <th className="w-[85vw]">CFO Name</th>
            </tr>
            <tr>
              <th className=" border">
                <input className="size-4" type="checkbox" />
              </th>
              <th className="font-light text-left pl-2">SynetecHQ</th>
              {enrichments.map((item) => (
                <th
                  className="border font-light w-10 "
                  key={item.enrichmentName}
                >
                  {"{}"}
                </th>
              ))}
              <th className="border">{""}</th>
            </tr>
            <tr>
              <th className=" border ">
                <input className="size-4" type="checkbox" />
              </th>
              <th className="font-light border text-left pl-2">Wavenest</th>
              {enrichments.map((item) => (
                <th className="border font-light " key={item.enrichmentName}>
                  {""}
                </th>
              ))}
              <th className="border">{""}</th>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);

export default EnrichmentTable;
